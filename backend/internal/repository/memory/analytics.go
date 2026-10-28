package memory

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"sort"
	"strings"
	"time"
)

type analyticsMemoryRepo struct{ s *MemoryStorage }

func (s *MemoryStorage) Analytics() repository.AnalyticsRepository {
	return &analyticsMemoryRepo{s: s}
}

func utcDate(t time.Time) string { return t.UTC().Format("2006-01-02") }

func (r *analyticsMemoryRepo) AnalyticsOverview(ctx context.Context, from, to, now time.Time) (*models.AnalyticsOverview, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	out := &models.AnalyticsOverview{
		From:       from.UTC(),
		To:         to.UTC(),
		Generated:  now.UTC(),
		TotalUsers: len(r.s.users),
	}

	today := utcDate(now)
	wauSince := utcDate(now.AddDate(0, 0, -6))
	mauSince := utcDate(now.AddDate(0, 0, -29))

	dau := map[string]struct{}{}
	wau := map[string]struct{}{}
	mau := map[string]struct{}{}

	for userID, dates := range r.s.activity {
		for date := range dates {
			switch {
			case date >= today:
				dau[userID] = struct{}{}
				wau[userID] = struct{}{}
				mau[userID] = struct{}{}
			case date >= wauSince:
				wau[userID] = struct{}{}
				mau[userID] = struct{}{}
			case date >= mauSince:
				mau[userID] = struct{}{}
			}
		}
	}
	out.Active = models.AnalyticsActiveUsers{DAU: len(dau), WAU: len(wau), MAU: len(mau)}

	activeSince := func(t time.Time) bool { return !t.Before(from) && t.Before(to) }

	for _, user := range r.s.users {
		if !user.CreatedAt.Before(from) && user.CreatedAt.Before(to) {
			out.NewUsers++
		}
	}

	for _, session := range r.s.sessions {
		if !session.CreatedAt.Before(from) && session.CreatedAt.Before(to) {
			out.Sessions++
		}
		if session.Status == "COMPLETED" && session.Mode == "full" && session.CompletedAt != nil && activeSince(*session.CompletedAt) {
			out.CompletedMocks++
		}
	}

	for _, evals := range r.s.evaluations {
		for _, evaluation := range evals {
			if !activeSince(evaluation.CreatedAt) {
				continue
			}
			out.Evaluations++
			questionType := strings.ToUpper(evaluation.QuestionType)
			switch {
			case strings.Contains(questionType, "SPEAK"):
				out.SpeakingCount++
			case strings.Contains(questionType, "WRITE"):
				out.WritingCount++
			}
			if evaluation.Status == "FAILED" {
				out.ErrorCount++
			}
		}
	}

	for _, event := range r.s.aiUsage {
		if activeSince(event.CreatedAt) && strings.EqualFold(event.Kind, "tts") {
			out.TTSCalls++
		}
	}

	for _, ledger := range r.s.xpEvents {
		for _, event := range ledger {
			if activeSince(event.CreatedAt) {
				out.XPAwarded += event.XP
			}
		}
	}

	for _, events := range r.s.events {
		for _, event := range events {
			if !activeSince(event.CreatedAt) {
				continue
			}
			switch event.EventType {
			case "ANSWER_REJECTED_DEADLINE", "STAGE_TIMEOUT", "SECURITY_REJECTED":
				out.ErrorCount++
			}
		}
	}

	return out, nil
}

func (r *analyticsMemoryRepo) AnalyticsTimeseries(ctx context.Context, metric string, from, to time.Time, bucket string) ([]models.AnalyticsPoint, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	counts := map[string]int{}
	add := func(at time.Time) {
		if at.Before(from) || !at.Before(to) {
			return
		}
		counts[timeseriesKey(at, bucket)]++
	}

	switch metric {
	case "signups":
		for _, user := range r.s.users {
			add(user.CreatedAt)
		}
	case "active":
		if bucket == "day" {
			fromDate := utcDate(from)
			toDate := utcDate(to)
			for _, dates := range r.s.activity {
				for date := range dates {
					if date < fromDate || date > toDate {
						continue
					}
					counts[date]++
				}
			}
		} else {
			seen := map[string]map[string]struct{}{} // bucket -> userIDs
			for userID, events := range r.s.learningEvents {
				for _, event := range events {
					if event.CreatedAt.Before(from) || !event.CreatedAt.Before(to) {
						continue
					}
					key := timeseriesKey(event.CreatedAt, bucket)
					if seen[key] == nil {
						seen[key] = map[string]struct{}{}
					}
					seen[key][userID] = struct{}{}
				}
			}
			for _, session := range r.s.sessions {
				if session.CreatedAt.Before(from) || !session.CreatedAt.Before(to) {
					continue
				}
				key := timeseriesKey(session.CreatedAt, bucket)
				if seen[key] == nil {
					seen[key] = map[string]struct{}{}
				}
				seen[key][session.UserID] = struct{}{}
			}
			for key, users := range seen {
				counts[key] = len(users)
			}
		}
	case "mocks":
		for _, session := range r.s.sessions {
			if session.Status != "COMPLETED" || session.CompletedAt == nil {
				continue
			}
			add(*session.CompletedAt)
		}
	case "evaluations":
		for _, evals := range r.s.evaluations {
			for _, evaluation := range evals {
				add(evaluation.CreatedAt)
			}
		}
	case "tts":
		for _, event := range r.s.aiUsage {
			if strings.EqualFold(event.Kind, "tts") {
				add(event.CreatedAt)
			}
		}
	default:
		return nil, nil
	}

	points := make([]models.AnalyticsPoint, 0, len(counts))
	for key, value := range counts {
		points = append(points, models.AnalyticsPoint{T: key, Value: value})
	}
	sort.Slice(points, func(i, j int) bool { return points[i].T < points[j].T })
	return points, nil
}

func (r *analyticsMemoryRepo) AnalyticsFeatures(ctx context.Context, from, to time.Time, limit int) ([]models.AnalyticsFeature, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	type aggregate struct {
		count int
		users map[string]struct{}
	}
	rows := map[string]*aggregate{}
	add := func(source, key, userID string) {
		if strings.TrimSpace(key) == "" {
			return
		}
		id := source + "|" + key
		row := rows[id]
		if row == nil {
			row = &aggregate{users: map[string]struct{}{}}
			rows[id] = row
		}
		row.count++
		if userID != "" {
			row.users[userID] = struct{}{}
		}
	}

	for userID, events := range r.s.learningEvents {
		for _, event := range events {
			if event.CreatedAt.Before(from) || !event.CreatedAt.Before(to) {
				continue
			}
			add("learning_events", event.EventType, userID)
		}
	}
	for userID, attempts := range r.s.practiceAttempts {
		for _, attempt := range attempts {
			if attempt.CreatedAt.Before(from) || !attempt.CreatedAt.Before(to) {
				continue
			}
			add("practice_attempts", attempt.QuestionType, userID)
		}
	}
	for sessionID, evals := range r.s.evaluations {
		userID := ""
		if session := r.s.sessions[sessionID]; session != nil {
			userID = session.UserID
		}
		for _, evaluation := range evals {
			if evaluation.CreatedAt.Before(from) || !evaluation.CreatedAt.Before(to) {
				continue
			}
			add("evaluations", evaluation.QuestionType, userID)
		}
	}

	out := make([]models.AnalyticsFeature, 0, len(rows))
	for id, row := range rows {
		parts := strings.SplitN(id, "|", 2)
		out = append(out, models.AnalyticsFeature{
			Source: parts[0],
			Key:    parts[1],
			Count:  row.count,
			Users:  len(row.users),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Count != out[j].Count {
			return out[i].Count > out[j].Count
		}
		if out[i].Source != out[j].Source {
			return out[i].Source < out[j].Source
		}
		return out[i].Key < out[j].Key
	})
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

func (r *analyticsMemoryRepo) AnalyticsRetention(ctx context.Context, from, to, now time.Time) ([]models.RetentionCohort, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	type cohort struct {
		size int
		d1   int
		d7   int
		d30  int
	}
	cohorts := map[string]*cohort{}
	today := utcDate(now)

	for _, user := range r.s.users {
		if user.CreatedAt.Before(from) || !user.CreatedAt.Before(to) {
			continue
		}
		createdDate := utcDate(user.CreatedAt)
		row := cohorts[createdDate]
		if row == nil {
			row = &cohort{}
			cohorts[createdDate] = row
		}
		row.size++

		activity := r.s.activity[user.ID]
		if activity == nil {
			continue
		}
		for date := range activity {
			day, err := time.Parse("2006-01-02", date)
			if err != nil {
				continue
			}
			created, err := time.Parse("2006-01-02", createdDate)
			if err != nil {
				continue
			}
			offset := int(day.Sub(created).Hours() / 24)
			switch {
			case offset >= 30:
				row.d30++
				row.d7++
				row.d1++
			case offset >= 7:
				row.d7++
				row.d1++
			case offset >= 1:
				row.d1++
			}
		}
	}

	dates := make([]string, 0, len(cohorts))
	for date := range cohorts {
		dates = append(dates, date)
	}
	sort.Strings(dates)

	out := make([]models.RetentionCohort, 0, len(dates))
	for _, date := range dates {
		row := cohorts[date]
		created, _ := time.Parse("2006-01-02", date)
		cohortOut := models.RetentionCohort{Cohort: date, Size: row.size, D1Users: row.d1, D7Users: row.d7, D30Users: row.d30}
		if row.size > 0 {
			cohortOut.D1 = ratePtr(row.d1, row.size, dateOffsetEligible(created, today, 1))
			cohortOut.D7 = ratePtr(row.d7, row.size, dateOffsetEligible(created, today, 7))
			cohortOut.D30 = ratePtr(row.d30, row.size, dateOffsetEligible(created, today, 30))
		}
		out = append(out, cohortOut)
	}
	return out, nil
}

func ratePtr(hit, total int, eligible bool) *float64 {
	if !eligible || total == 0 {
		return nil
	}
	value := float64(hit) / float64(total) * 100
	return &value
}

func dateOffsetEligible(cohort time.Time, today string, offset int) bool {
	return cohort.AddDate(0, 0, offset).Format("2006-01-02") <= today
}

func timeseriesKey(at time.Time, bucket string) string {
	at = at.UTC()
	if bucket == "hour" {
		return at.Format("2006-01-02T15:00:00Z")
	}
	return at.Format("2006-01-02")
}
