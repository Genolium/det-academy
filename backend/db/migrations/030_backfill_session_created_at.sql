-- Earlier builds omitted test_sessions.created_at on insert, so PostgreSQL
-- stored Go's zero time (0001-01-01). The admin table then rendered
-- "01.01.1, 02:30:17" in Moscow time. Backfill from the earliest server-issued
-- question assignment, then from the first response, then from completion.
UPDATE test_sessions AS ts
SET created_at = COALESCE(
    (SELECT MIN(sq.issued_at) FROM session_questions sq WHERE sq.session_id = ts.id),
    (SELECT MIN(qr.created_at) FROM question_responses qr WHERE qr.session_id = ts.id),
    ts.completed_at,
    ts.deadline_at - INTERVAL '3 minutes',
    NOW()
)
WHERE ts.created_at < TIMESTAMPTZ '1900-01-01 00:00:00+00';
