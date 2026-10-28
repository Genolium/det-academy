package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
)

type AnalyticsRepo struct{ db *sql.DB }

func (s *PostgresStorage) Analytics() repository.AnalyticsRepository {
	return &AnalyticsRepo{db: s.db}
}

func (r *AnalyticsRepo) AnalyticsOverview(ctx context.Context, from, to, now time.Time) (*models.AnalyticsOverview, error) {
	out := &models.AnalyticsOverview{
		From:      from.UTC(),
		To:        to.UTC(),
		Generated: now.UTC(),
	}

	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&out.TotalUsers); err != nil {
		return nil, err
	}
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2`, from, to).Scan(&out.NewUsers); err != nil {
		return nil, err
	}

	today := now.UTC().Format("2006-01-02")
	week := now.UTC().AddDate(0, 0, -6).Format("2006-01-02")
	month := now.UTC().AddDate(0, 0, -29).Format("2006-01-02")
	if err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(DISTINCT user_id) FILTER (WHERE activity_date >= $1::date)::int,
			COUNT(DISTINCT user_id) FILTER (WHERE activity_date >= $2::date)::int,
			COUNT(DISTINCT user_id) FILTER (WHERE activity_date >= $3::date)::int
		FROM user_activity
		WHERE activity_date >= $3::date
	`, today, week, month).Scan(&out.Active.DAU, &out.Active.WAU, &out.Active.MAU); err != nil {
		return nil, err
	}

	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM test_sessions WHERE created_at >= $1 AND created_at < $2`, from, to).Scan(&out.Sessions); err != nil {
		return nil, err
	}
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM test_sessions
		WHERE status = 'COMPLETED' AND mode = 'full'
		  AND completed_at IS NOT NULL AND completed_at >= $1 AND completed_at < $2
	`, from, to).Scan(&out.CompletedMocks); err != nil {
		return nil, err
	}

	if err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*)::int,
			COUNT(*) FILTER (WHERE UPPER(question_type) LIKE '%SPEAK%')::int,
			COUNT(*) FILTER (WHERE UPPER(question_type) LIKE '%WRITE%')::int
		FROM evaluations
		WHERE created_at >= $1 AND created_at < $2
	`, from, to).Scan(&out.Evaluations, &out.SpeakingCount, &out.WritingCount); err != nil {
		return nil, err
	}

	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM ai_usage_events
		WHERE kind = 'tts' AND created_at >= $1 AND created_at < $2
	`, from, to).Scan(&out.TTSCalls); err != nil {
		return nil, err
	}

	if err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(xp), 0)::int FROM xp_events
		WHERE created_at >= $1 AND created_at < $2
	`, from, to).Scan(&out.XPAwarded); err != nil {
		return nil, err
	}

	var failedEvaluations, rejectedEvents int
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM evaluations
		WHERE status = 'FAILED' AND created_at >= $1 AND created_at < $2
	`, from, to).Scan(&failedEvaluations); err != nil {
		return nil, err
	}
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM session_events
		WHERE event_type IN ('ANSWER_REJECTED_DEADLINE', 'STAGE_TIMEOUT', 'SECURITY_REJECTED')
		  AND created_at >= $1 AND created_at < $2
	`, from, to).Scan(&rejectedEvents); err != nil {
		return nil, err
	}
	out.ErrorCount = failedEvaluations + rejectedEvents

	return out, nil
}

func (r *AnalyticsRepo) AnalyticsTimeseries(ctx context.Context, metric string, from, to time.Time, bucket string) ([]models.AnalyticsPoint, error) {
	bucketExpr := "date_trunc('day', %s AT TIME ZONE 'UTC')"
	format := "YYYY-MM-DD"
	if bucket == "hour" {
		bucketExpr = "date_trunc('hour', %s AT TIME ZONE 'UTC')"
		format = `YYYY-MM-DD"T"HH24:00:00"Z"`
	}

	var query string
	switch metric {
	case "signups":
		query = `SELECT to_char(` + fmt.Sprintf(bucketExpr, "created_at") + `, $3), COUNT(*)::int
			FROM users WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`
	case "active":
		if bucket == "day" {
			query = `SELECT to_char(activity_date, $3), COUNT(DISTINCT user_id)::int
				FROM user_activity WHERE activity_date >= $1::date AND activity_date <= $2::date
				GROUP BY 1 ORDER BY 1`
		} else {
			query = `SELECT to_char(bucket, $3), COUNT(DISTINCT user_id)::int FROM (
				SELECT ` + fmt.Sprintf(bucketExpr, "created_at") + ` AS bucket, user_id FROM learning_events
					WHERE created_at >= $1 AND created_at < $2
				UNION ALL
				SELECT ` + fmt.Sprintf(bucketExpr, "created_at") + ` AS bucket, user_id FROM test_sessions
					WHERE created_at >= $1 AND created_at < $2
			) activity GROUP BY 1 ORDER BY 1`
		}
	case "mocks":
		query = `SELECT to_char(` + fmt.Sprintf(bucketExpr, "completed_at") + `, $3), COUNT(*)::int
			FROM test_sessions
			WHERE status = 'COMPLETED' AND mode = 'full'
			  AND completed_at IS NOT NULL AND completed_at >= $1 AND completed_at < $2
			GROUP BY 1 ORDER BY 1`
	case "evaluations":
		query = `SELECT to_char(` + fmt.Sprintf(bucketExpr, "created_at") + `, $3), COUNT(*)::int
			FROM evaluations WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`
	case "tts":
		query = `SELECT to_char(` + fmt.Sprintf(bucketExpr, "created_at") + `, $3), COUNT(*)::int
			FROM ai_usage_events WHERE kind = 'tts' AND created_at >= $1 AND created_at < $2
			GROUP BY 1 ORDER BY 1`
	default:
		return nil, nil
	}

	rows, err := r.db.QueryContext(ctx, query, from, to, format)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.AnalyticsPoint{}
	for rows.Next() {
		var point models.AnalyticsPoint
		if err := rows.Scan(&point.T, &point.Value); err != nil {
			return nil, err
		}
		out = append(out, point)
	}
	return out, rows.Err()
}

func (r *AnalyticsRepo) AnalyticsFeatures(ctx context.Context, from, to time.Time, limit int) ([]models.AnalyticsFeature, error) {
	if limit <= 0 {
		limit = 12
	}
	rows, err := r.db.QueryContext(ctx, `
		SELECT source, key, count, users FROM (
			SELECT 'learning_events' AS source, event_type AS key,
			       COUNT(*)::int AS count, COUNT(DISTINCT user_id)::int AS users
			FROM learning_events WHERE created_at >= $1 AND created_at < $2
			GROUP BY event_type
			UNION ALL
			SELECT 'practice_attempts', question_type, COUNT(*)::int, COUNT(DISTINCT user_id)::int
			FROM practice_attempts WHERE created_at >= $1 AND created_at < $2
			GROUP BY question_type
			UNION ALL
			SELECT 'evaluations', e.question_type, COUNT(*)::int, COUNT(DISTINCT s.user_id)::int
			FROM evaluations e JOIN test_sessions s ON s.id = e.session_id
			WHERE e.created_at >= $1 AND e.created_at < $2
			GROUP BY e.question_type
		) features
		ORDER BY count DESC, source ASC, key ASC
		LIMIT $3
	`, from, to, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.AnalyticsFeature{}
	for rows.Next() {
		var row models.AnalyticsFeature
		if err := rows.Scan(&row.Source, &row.Key, &row.Count, &row.Users); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *AnalyticsRepo) AnalyticsRetention(ctx context.Context, from, to, now time.Time) ([]models.RetentionCohort, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT to_char(u.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS cohort,
		       COUNT(*)::int AS size,
		       COUNT(*) FILTER (WHERE EXISTS (
		           SELECT 1 FROM user_activity a
		           WHERE a.user_id = u.id AND a.activity_date >= (u.created_at AT TIME ZONE 'UTC')::date + 1
		       ))::int AS d1,
		       COUNT(*) FILTER (WHERE EXISTS (
		           SELECT 1 FROM user_activity a
		           WHERE a.user_id = u.id AND a.activity_date >= (u.created_at AT TIME ZONE 'UTC')::date + 7
		       ))::int AS d7,
		       COUNT(*) FILTER (WHERE EXISTS (
		           SELECT 1 FROM user_activity a
		           WHERE a.user_id = u.id AND a.activity_date >= (u.created_at AT TIME ZONE 'UTC')::date + 30
		       ))::int AS d30
		FROM users u
		WHERE u.created_at >= $1 AND u.created_at < $2
		GROUP BY 1 ORDER BY 1
	`, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	today := now.UTC().Format("2006-01-02")
	out := []models.RetentionCohort{}
	for rows.Next() {
		var row models.RetentionCohort
		if err := rows.Scan(&row.Cohort, &row.Size, &row.D1Users, &row.D7Users, &row.D30Users); err != nil {
			return nil, err
		}
		cohortDate, _ := time.Parse("2006-01-02", row.Cohort)
		row.D1 = rateOrNil(row.D1Users, row.Size, cohortDate.AddDate(0, 0, 1).Format("2006-01-02") <= today)
		row.D7 = rateOrNil(row.D7Users, row.Size, cohortDate.AddDate(0, 0, 7).Format("2006-01-02") <= today)
		row.D30 = rateOrNil(row.D30Users, row.Size, cohortDate.AddDate(0, 0, 30).Format("2006-01-02") <= today)
		out = append(out, row)
	}
	return out, rows.Err()
}

func rateOrNil(hit, total int, eligible bool) *float64 {
	if !eligible || total == 0 {
		return nil
	}
	value := float64(hit) / float64(total) * 100
	return &value
}
