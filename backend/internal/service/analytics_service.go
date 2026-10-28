package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"
)

// AnalyticsCacheTTL keeps the dashboard snappy without hiding a fresh event for
// long. Admin traffic is low, so a small in-process cache removes the repeated
// full-table aggregates that every range switch would otherwise trigger.
const AnalyticsCacheTTL = 45 * time.Second

var ErrInvalidAnalyticsRange = errors.New("invalid analytics range or bucket")

var analyticsMetrics = map[string]struct{}{
	"users":       {},
	"signups":     {},
	"active":      {},
	"mocks":       {},
	"evaluations": {},
	"tts":         {},
}

type analyticsCacheEntry struct {
	expires time.Time
	payload any
}

type AnalyticsService struct {
	repo      repository.AnalyticsRepository
	mu        sync.Mutex
	cache     map[string]analyticsCacheEntry
	now       func() time.Time
	lastSweep time.Time
}

func NewAnalyticsService(repo repository.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{
		repo:  repo,
		cache: map[string]analyticsCacheEntry{},
		now:   func() time.Time { return time.Now().UTC() },
	}
}

// ParseAnalyticsWindow validates the public query parameters. Only four ranges
// and two buckets are accepted, so the resulting SQL can never be pointed at an
// arbitrary time span. Hourly buckets are limited to short ranges to keep the
// response small (a 90-day hourly series would be 2,160 points).
func ParseAnalyticsWindow(rangeKey, bucket string) (models.AnalyticsWindow, error) {
	if rangeKey == "" {
		rangeKey = "7d"
	}
	var duration time.Duration
	switch rangeKey {
	case "24h":
		duration = 24 * time.Hour
	case "7d":
		duration = 7 * 24 * time.Hour
	case "30d":
		duration = 30 * 24 * time.Hour
	case "90d":
		duration = 90 * 24 * time.Hour
	default:
		return models.AnalyticsWindow{}, fmt.Errorf("%w: range must be 24h, 7d, 30d or 90d", ErrInvalidAnalyticsRange)
	}

	if bucket == "" {
		if rangeKey == "24h" {
			bucket = "hour"
		} else {
			bucket = "day"
		}
	}
	if bucket != "hour" && bucket != "day" {
		return models.AnalyticsWindow{}, fmt.Errorf("%w: bucket must be hour or day", ErrInvalidAnalyticsRange)
	}
	if bucket == "hour" && (rangeKey == "30d" || rangeKey == "90d") {
		return models.AnalyticsWindow{}, fmt.Errorf("%w: hourly buckets are limited to 24h and 7d", ErrInvalidAnalyticsRange)
	}

	now := time.Now().UTC()
	return models.AnalyticsWindow{
		Range:  rangeKey,
		Bucket: bucket,
		From:   now.Add(-duration),
		To:     now,
	}, nil
}

func (s *AnalyticsService) cached(key string, load func() (any, error)) (any, error) {
	now := s.now()

	s.mu.Lock()
	if entry, ok := s.cache[key]; ok && entry.expires.After(now) {
		s.mu.Unlock()
		return entry.payload, nil
	}
	s.mu.Unlock()

	payload, err := load()
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	s.cache[key] = analyticsCacheEntry{expires: now.Add(AnalyticsCacheTTL), payload: payload}
	if now.Sub(s.lastSweep) > time.Minute {
		for k, entry := range s.cache {
			if entry.expires.Before(now) {
				delete(s.cache, k)
			}
		}
		s.lastSweep = now
	}
	s.mu.Unlock()
	return payload, nil
}

func (s *AnalyticsService) Overview(ctx context.Context, window models.AnalyticsWindow) (*models.AnalyticsOverview, error) {
	value, err := s.cached("overview|"+window.Range, func() (any, error) {
		overview, err := s.repo.AnalyticsOverview(ctx, window.From, window.To, s.now())
		if err != nil {
			return nil, err
		}
		overview.Range = window.Range
		return overview, nil
	})
	if err != nil {
		return nil, err
	}
	overview, ok := value.(*models.AnalyticsOverview)
	if !ok {
		return nil, errors.New("analytics cache returned an unexpected payload")
	}
	copy := *overview
	return &copy, nil
}

func (s *AnalyticsService) Timeseries(ctx context.Context, window models.AnalyticsWindow, metric string) (*models.AnalyticsSeries, error) {
	if _, ok := analyticsMetrics[metric]; !ok {
		return nil, fmt.Errorf("%w: unknown metric", ErrInvalidAnalyticsRange)
	}

	value, err := s.cached("timeseries|"+window.Range+"|"+window.Bucket+"|"+metric, func() (any, error) {
		return s.loadTimeseries(ctx, window, metric)
	})
	if err != nil {
		return nil, err
	}
	series, ok := value.(*models.AnalyticsSeries)
	if !ok {
		return nil, errors.New("analytics cache returned an unexpected payload")
	}
	copy := *series
	copy.Points = append([]models.AnalyticsPoint(nil), series.Points...)
	return &copy, nil
}

func (s *AnalyticsService) loadTimeseries(ctx context.Context, window models.AnalyticsWindow, metric string) (*models.AnalyticsSeries, error) {
	from := truncateBucket(window.From, window.Bucket)
	queryMetric := metric
	if metric == "users" {
		queryMetric = "signups"
	}

	points, err := s.repo.AnalyticsTimeseries(ctx, queryMetric, window.From, window.To, window.Bucket)
	if err != nil {
		return nil, err
	}

	series := &models.AnalyticsSeries{
		Metric: metric,
		Range:  window.Range,
		Bucket: window.Bucket,
		Points: fillBuckets(points, from, window.To, window.Bucket),
	}

	switch metric {
	case "users":
		overview, err := s.Overview(ctx, window)
		if err != nil {
			return nil, err
		}
		baseline := overview.TotalUsers - overview.NewUsers
		if baseline < 0 {
			baseline = 0
		}
		running := baseline
		for i := range series.Points {
			running += series.Points[i].Value
			series.Points[i].Value = running
		}
		series.Total = overview.TotalUsers
		series.Cumulative = true
	default:
		total := 0
		for _, point := range series.Points {
			total += point.Value
		}
		series.Total = total
	}

	return series, nil
}

func (s *AnalyticsService) Features(ctx context.Context, window models.AnalyticsWindow) (*models.AnalyticsFeatures, error) {
	value, err := s.cached("features|"+window.Range, func() (any, error) {
		items, err := s.repo.AnalyticsFeatures(ctx, window.From, window.To, 12)
		if err != nil {
			return nil, err
		}
		sort.SliceStable(items, func(i, j int) bool {
			if items[i].Count != items[j].Count {
				return items[i].Count > items[j].Count
			}
			return items[i].Key < items[j].Key
		})
		return &models.AnalyticsFeatures{
			Range:              window.Range,
			Items:              items,
			PageViewsAvailable: false,
			Note:               "No page-view table exists yet: feature usage is derived from learning_events, practice_attempts and evaluations.",
		}, nil
	})
	if err != nil {
		return nil, err
	}
	features, ok := value.(*models.AnalyticsFeatures)
	if !ok {
		return nil, errors.New("analytics cache returned an unexpected payload")
	}
	copy := *features
	copy.Items = append([]models.AnalyticsFeature(nil), features.Items...)
	return &copy, nil
}

func (s *AnalyticsService) Retention(ctx context.Context, window models.AnalyticsWindow) (*models.AnalyticsRetention, error) {
	value, err := s.cached("retention|"+window.Range, func() (any, error) {
		cohorts, err := s.repo.AnalyticsRetention(ctx, window.From, window.To, s.now())
		if err != nil {
			return nil, err
		}
		return &models.AnalyticsRetention{
			Range:   window.Range,
			Cohorts: cohorts,
			Note:    "Retention uses the server-owned user_activity ledger. A dash means the cohort is not old enough to measure that offset.",
		}, nil
	})
	if err != nil {
		return nil, err
	}
	retention, ok := value.(*models.AnalyticsRetention)
	if !ok {
		return nil, errors.New("analytics cache returned an unexpected payload")
	}
	copy := *retention
	copy.Cohorts = append([]models.RetentionCohort(nil), retention.Cohorts...)
	return &copy, nil
}

func truncateBucket(at time.Time, bucket string) time.Time {
	at = at.UTC()
	if bucket == "hour" {
		return at.Truncate(time.Hour)
	}
	return time.Date(at.Year(), at.Month(), at.Day(), 0, 0, 0, 0, time.UTC)
}

// fillBuckets emits a contiguous series, so a quiet day is a visible zero
// rather than a missing point that would make the line jump.
func fillBuckets(points []models.AnalyticsPoint, from, to time.Time, bucket string) []models.AnalyticsPoint {
	values := make(map[string]int, len(points))
	for _, point := range points {
		values[point.T] = point.Value
	}

	step := 24 * time.Hour
	cursor := truncateBucket(from, bucket)
	if bucket == "hour" {
		step = time.Hour
	}
	out := []models.AnalyticsPoint{}
	for cursor.Before(to) {
		key := cursor.Format("2006-01-02")
		if bucket == "hour" {
			key = cursor.Format("2006-01-02T15:00:00Z")
		}
		out = append(out, models.AnalyticsPoint{T: key, Value: values[key]})
		cursor = cursor.Add(step)
	}
	return out
}
