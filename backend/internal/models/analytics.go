package models

import "time"

// AnalyticsWindow is a validated admin analytics request. The handler caps the
// range at 90 days and the bucket at one hour so a single request can never
// scan an unbounded slice of the event tables.
type AnalyticsWindow struct {
	Range  string    `json:"range"`
	Bucket string    `json:"bucket"`
	From   time.Time `json:"from"`
	To     time.Time `json:"to"`
}

// AnalyticsActiveUsers is the distinct-user count over the standard rolling
// windows. It is deliberately independent of the selected range: DAU/WAU/MAU
// always describe the present, not the reporting window.
type AnalyticsActiveUsers struct {
	DAU int `json:"dau"`
	WAU int `json:"wau"`
	MAU int `json:"mau"`
}

// AnalyticsOverview is the KPI payload for GET /admin/analytics/overview.
// Every number is an aggregate: no email, name or user id is returned.
type AnalyticsOverview struct {
	Range     string    `json:"range"`
	From      time.Time `json:"from"`
	To        time.Time `json:"to"`
	Generated time.Time `json:"generatedAt"`

	TotalUsers int                  `json:"totalUsers"`
	NewUsers   int                  `json:"newUsers"`
	Active     AnalyticsActiveUsers `json:"activeUsers"`

	Sessions       int `json:"sessions"`
	CompletedMocks int `json:"completedMocks"`
	Evaluations    int `json:"evaluations"`
	SpeakingCount  int `json:"speakingEvaluations"`
	WritingCount   int `json:"writingEvaluations"`
	TTSCalls       int `json:"ttsCalls"`
	XPAwarded      int `json:"xpAwarded"`
	ErrorCount     int `json:"errorCount"`
}

// AnalyticsPoint is one time bucket. T is an RFC3339 hour for hourly buckets
// and a YYYY-MM-DD day for daily buckets.
type AnalyticsPoint struct {
	T     string `json:"t"`
	Value int    `json:"value"`
}

// AnalyticsSeries is the GET /admin/analytics/timeseries payload.
type AnalyticsSeries struct {
	Metric string           `json:"metric"`
	Range  string           `json:"range"`
	Bucket string           `json:"bucket"`
	Points []AnalyticsPoint `json:"points"`
	Total  int              `json:"total"`
	// Cumulative marks series where the value is a running total (users).
	Cumulative bool `json:"cumulative"`
}

// AnalyticsFeature is one ranked feature row. Source explains which existing
// table produced it: learning_events, practice_attempts or evaluations.
type AnalyticsFeature struct {
	Source string `json:"source"`
	Key    string `json:"key"`
	Count  int    `json:"count"`
	Users  int    `json:"users"`
}

// AnalyticsFeatures is the GET /admin/analytics/features payload.
type AnalyticsFeatures struct {
	Range              string             `json:"range"`
	Items              []AnalyticsFeature `json:"items"`
	PageViewsAvailable bool               `json:"pageViewsAvailable"`
	Note               string             `json:"note"`
}

// RetentionCohort is one signup cohort. D1/D7/D30 are the share of the cohort
// that was active on or after the corresponding day offset. A nil rate means
// the cohort is too young to measure that offset yet; it is never reported as
// zero, which would look like a retention failure.
type RetentionCohort struct {
	Cohort   string   `json:"cohort"`
	Size     int      `json:"size"`
	D1       *float64 `json:"d1"`
	D7       *float64 `json:"d7"`
	D30      *float64 `json:"d30"`
	D1Users  int      `json:"d1Users"`
	D7Users  int      `json:"d7Users"`
	D30Users int      `json:"d30Users"`
}

// AnalyticsRetention is the GET /admin/analytics/retention payload.
type AnalyticsRetention struct {
	Range   string            `json:"range"`
	Cohorts []RetentionCohort `json:"cohorts"`
	Note    string            `json:"note"`
}
