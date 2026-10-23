package postgres

import (
	"context"
	"database/sql"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

type PostgresStorage struct {
	db                *sql.DB
	users             *UserRepo
	theory            *TheoryRepo
	questions         *QuestionRepo
	sessions          *SessionRepo
	certificates      *CertRepo
	banners           *BannerRepo
	institutions      *InstitutionRepo
	study             *StudyRepo
	vocabulary        *VocabularyRepo
	oauthTransactions *OAuthTransactionRepo
	refreshTokens     *RefreshTokenRepo
}

func New(dbURL string) (*PostgresStorage, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := waitForDatabase(db); err != nil {
		db.Close()
		return nil, err
	}

	s := &PostgresStorage{
		db:                db,
		users:             &UserRepo{db: db},
		theory:            &TheoryRepo{db: db},
		questions:         &QuestionRepo{db: db},
		sessions:          &SessionRepo{db: db},
		certificates:      &CertRepo{db: db},
		banners:           &BannerRepo{db: db},
		institutions:      &InstitutionRepo{db: db},
		study:             &StudyRepo{db: db},
		vocabulary:        &VocabularyRepo{db: db},
		oauthTransactions: &OAuthTransactionRepo{db: db},
		refreshTokens:     &RefreshTokenRepo{db: db},
	}

	return s, nil
}

// waitForDatabase retries the initial connection. On a fresh deployment the
// backend container can start before PostgreSQL accepts connections, and a
// single failed ping must not take the whole API down.
func waitForDatabase(db *sql.DB) error {
	timeout := 60 * time.Second
	if raw := strings.TrimSpace(os.Getenv("DB_CONNECT_TIMEOUT")); raw != "" {
		if parsed, err := time.ParseDuration(raw); err == nil && parsed > 0 {
			timeout = parsed
		}
	}

	deadline := time.Now().Add(timeout)
	var lastErr error
	for {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := db.PingContext(ctx)
		cancel()
		if err == nil {
			return nil
		}
		lastErr = err
		if time.Now().After(deadline) {
			break
		}
		time.Sleep(2 * time.Second)
	}
	return fmt.Errorf("failed to ping postgres within %s: %w", timeout, lastErr)
}

func (s *PostgresStorage) Users() repository.UserRepository               { return s.users }
func (s *PostgresStorage) Theory() repository.TheoryRepository            { return s.theory }
func (s *PostgresStorage) Questions() repository.QuestionRepository       { return s.questions }
func (s *PostgresStorage) Sessions() repository.TestSessionRepository     { return s.sessions }
func (s *PostgresStorage) Certificates() repository.CertificateRepository { return s.certificates }
func (s *PostgresStorage) Banners() repository.BannerRepository           { return s.banners }
func (s *PostgresStorage) Institutions() repository.InstitutionRepository { return s.institutions }
func (s *PostgresStorage) Study() repository.StudyRepository              { return s.study }
func (s *PostgresStorage) Vocabulary() repository.VocabularyRepository    { return s.vocabulary }
func (s *PostgresStorage) OAuthTransactions() repository.OAuthTransactionRepository {
	return s.oauthTransactions
}

func (s *PostgresStorage) RefreshTokens() repository.RefreshTokenRepository {
	return s.refreshTokens
}
func (s *PostgresStorage) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }
func (s *PostgresStorage) Close() error                   { return s.db.Close() }

// --- Users ---

type UserRepo struct{ db *sql.DB }

func (r *UserRepo) Create(ctx context.Context, u *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, name, role, avatar_url, locale, token_version, email_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	now := time.Now().UTC()
	u.CreatedAt = now
	u.UpdatedAt = now
	role := u.Role
	if role == "" {
		role = "student"
	}
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	_, err := r.db.ExecContext(ctx, query, u.ID, u.Email, u.PasswordHash, u.Name, role, u.AvatarURL, u.Locale, u.TokenVersion, u.EmailVerified, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, token_version, email_verified, created_at, updated_at FROM users WHERE id = $1`
	var u models.User
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.TokenVersion, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	// ORDER BY keeps the lookup deterministic when legacy rows still differ
	// only by letter case and the case-insensitive index could not be built.
	query := `SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, token_version, email_verified, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1) ORDER BY created_at ASC, id ASC LIMIT 1`
	var u models.User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.TokenVersion, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Update(ctx context.Context, u *models.User) error {
	query := `UPDATE users SET email = $1, name = $2, avatar_url = $3, locale = $4, updated_at = $5 WHERE id = $6`
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	u.UpdatedAt = time.Now().UTC()
	_, err := r.db.ExecContext(ctx, query, u.Email, u.Name, u.AvatarURL, u.Locale, u.UpdatedAt, u.ID)
	return err
}

func (r *UserRepo) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = $2, token_version = token_version + 1 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, passwordHash, time.Now().UTC(), id)
	return err
}

func (r *UserRepo) UpdateRole(ctx context.Context, id, role string) error {
	query := `UPDATE users SET role = $1, updated_at = $2, token_version = token_version + 1 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, role, time.Now().UTC(), id)
	return err
}

func (r *UserRepo) IncrementTokenVersion(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *UserRepo) SetEmailVerification(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users
		SET email_verification_token_hash = $1, email_verification_expires = $2, updated_at = NOW()
		WHERE id = $3
	`, tokenHash, expiresAt, userID)
	return err
}

func (r *UserRepo) MarkEmailVerified(ctx context.Context, tokenHash string) (*models.User, error) {
	query := `
		UPDATE users
		SET email_verified = TRUE, email_verification_token_hash = '', email_verification_expires = NULL, updated_at = NOW()
		WHERE email_verification_token_hash = $1 AND email_verification_expires > NOW()
		RETURNING id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, token_version, email_verified, created_at, updated_at
	`
	var u models.User
	if err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale,
		&u.TokenVersion, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *UserRepo) GetSocialAccounts(ctx context.Context, userID string) ([]models.SocialAccount, error) {
	query := `SELECT id, user_id, provider, provider_user_id, COALESCE(email, ''), created_at FROM user_social_accounts WHERE user_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []models.SocialAccount
	for rows.Next() {
		var sa models.SocialAccount
		if err := rows.Scan(&sa.ID, &sa.UserID, &sa.Provider, &sa.ProviderUserID, &sa.Email, &sa.CreatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, sa)
	}
	return accounts, nil
}

func (r *UserRepo) GetSocialAccountByProviderUID(ctx context.Context, provider, providerUID string) (*models.SocialAccount, error) {
	query := `SELECT id, user_id, provider, provider_user_id, COALESCE(email, ''), created_at FROM user_social_accounts WHERE provider = $1 AND provider_user_id = $2`
	var sa models.SocialAccount
	err := r.db.QueryRowContext(ctx, query, provider, providerUID).Scan(&sa.ID, &sa.UserID, &sa.Provider, &sa.ProviderUserID, &sa.Email, &sa.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &sa, nil
}

func (r *UserRepo) LinkSocialAccount(ctx context.Context, sa *models.SocialAccount) error {
	if sa.ID == "" {
		sa.ID = uuid.New().String()
	}
	sa.CreatedAt = time.Now().UTC()

	// Delete any conflicting record for (provider, provider_user_id) belonging to another user
	// to avoid violating uq_provider_user_id unique constraint
	delQuery := `DELETE FROM user_social_accounts WHERE provider = $1 AND provider_user_id = $2 AND user_id != $3`
	_, _ = r.db.ExecContext(ctx, delQuery, sa.Provider, sa.ProviderUserID, sa.UserID)

	query := `INSERT INTO user_social_accounts (id, user_id, provider, provider_user_id, email, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, provider) DO UPDATE SET 
			provider_user_id = EXCLUDED.provider_user_id, 
			email = CASE WHEN EXCLUDED.email != '' THEN EXCLUDED.email ELSE user_social_accounts.email END,
			created_at = EXCLUDED.created_at`
	_, err := r.db.ExecContext(ctx, query, sa.ID, sa.UserID, sa.Provider, sa.ProviderUserID, sa.Email, sa.CreatedAt)
	return err
}

func (r *UserRepo) UnlinkSocialAccount(ctx context.Context, userID, provider string) error {
	query := `DELETE FROM user_social_accounts WHERE user_id = $1 AND provider = $2`
	_, err := r.db.ExecContext(ctx, query, userID, provider)
	return err
}

func (r *UserRepo) ListAll(ctx context.Context, page, limit int, search, role string) ([]models.User, int, error) {
	var users []models.User
	whereClauses := []string{"1=1"}
	var args []interface{}
	argIdx := 1

	if role != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, role)
		argIdx++
	}

	if search != "" {
		searchLike := "%" + strings.ToLower(search) + "%"
		whereClauses = append(whereClauses, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(email) LIKE $%d)", argIdx, argIdx))
		args = append(args, searchLike)
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE %s", whereSQL)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	query := fmt.Sprintf("SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, token_version, email_verified, created_at, updated_at FROM users WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d", whereSQL, argIdx, argIdx+1)
	args = append(args, limit, (page-1)*limit)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.TokenVersion, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}

	return users, total, nil
}

// --- Theory ---

type TheoryRepo struct{ db *sql.DB }

func (r *TheoryRepo) GetUserProgress(ctx context.Context, userID string) ([]string, error) {
	query := `SELECT lesson_slug FROM theory_progress WHERE user_id = $1 AND is_completed = true`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []string
	for rows.Next() {
		var slug string
		if err := rows.Scan(&slug); err != nil {
			return nil, err
		}
		lessons = append(lessons, slug)
	}
	return lessons, nil
}

func (r *TheoryRepo) ToggleProgress(ctx context.Context, userID, lessonSlug string) (bool, error) {
	query := `
		INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
		VALUES ($1, $2, true, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_slug)
		DO UPDATE SET is_completed = NOT theory_progress.is_completed, updated_at = CURRENT_TIMESTAMP
		RETURNING is_completed
	`
	var isCompleted bool
	err := r.db.QueryRowContext(ctx, query, userID, lessonSlug).Scan(&isCompleted)
	return isCompleted, err
}

func (r *TheoryRepo) SetProgress(ctx context.Context, userID, lessonSlug string, completed bool) error {
	query := `
		INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_slug)
		DO UPDATE SET is_completed = $3, updated_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.ExecContext(ctx, query, userID, lessonSlug, completed)
	return err
}

// --- Questions ---

type QuestionRepo struct{ db *sql.DB }

func (r *QuestionRepo) ListByTypeAndDifficulty(ctx context.Context, qType, difficultyBand string) ([]models.Question, error) {
	query := `SELECT id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active, created_at FROM questions WHERE is_active = true`
	var args []interface{}
	idx := 1

	if qType != "" {
		query += fmt.Sprintf(" AND type = $%d", idx)
		args = append(args, qType)
		idx++
	}
	if difficultyBand != "" {
		query += fmt.Sprintf(" AND difficulty_band = $%d", idx)
		args = append(args, difficultyBand)
	}
	query += " ORDER BY id"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		var payloadBytes, correctBytes []byte
		if err := rows.Scan(&q.ID, &q.Type, &q.DifficultyBand, &payloadBytes, &correctBytes, &q.TimeLimitSec, &q.IsActive, &q.CreatedAt); err != nil {
			return nil, err
		}
		q.ContentPayload = payloadBytes
		q.CorrectAnswers = correctBytes
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *QuestionRepo) GetByID(ctx context.Context, id string) (*models.Question, error) {
	query := `SELECT id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active, created_at FROM questions WHERE id = $1`
	var q models.Question
	var payloadBytes, correctBytes []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&q.ID, &q.Type, &q.DifficultyBand, &payloadBytes, &correctBytes, &q.TimeLimitSec, &q.IsActive, &q.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	q.ContentPayload = payloadBytes
	q.CorrectAnswers = correctBytes
	return &q, nil
}

func (r *QuestionRepo) ListAllActive(ctx context.Context) ([]models.Question, error) {
	query := `SELECT id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active, created_at FROM questions ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		var payloadBytes, correctBytes []byte
		if err := rows.Scan(&q.ID, &q.Type, &q.DifficultyBand, &payloadBytes, &correctBytes, &q.TimeLimitSec, &q.IsActive, &q.CreatedAt); err != nil {
			return nil, err
		}
		q.ContentPayload = payloadBytes
		q.CorrectAnswers = correctBytes
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *QuestionRepo) Create(ctx context.Context, q *models.Question) error {
	query := `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.ExecContext(ctx, query, q.ID, q.Type, q.DifficultyBand, q.ContentPayload, q.CorrectAnswers, q.TimeLimitSec, q.IsActive, q.CreatedAt)
	return err
}

func (r *QuestionRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM questions WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *QuestionRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM questions`).Scan(&count)
	return count, err
}

// --- Test Sessions ---

type SessionRepo struct{ db *sql.DB }

func (r *SessionRepo) Create(ctx context.Context, s *models.TestSession) error {
	query := `
		INSERT INTO test_sessions (id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, mode, reading_score, listening_score, writing_score, speaking_score, deadline_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err := r.db.ExecContext(ctx, query, s.ID, s.UserID, s.CandidateName, s.Status, s.CurrentStage, s.StageName, s.DifficultyLevel, envOrDefaultMode(s.Mode), s.ReadingScore, s.ListeningScore, s.WritingScore, s.SpeakingScore, s.DeadlineAt, s.CreatedAt)
	return err
}

func (r *SessionRepo) GetByID(ctx context.Context, id string) (*models.TestSession, error) {
	query := `
		SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level,
		       COALESCE(mode, 'full'),
		       overall_score, reading_score, listening_score, writing_score, speaking_score,
		       literacy_score, comprehension_score, production_score, conversation_score,
		       deadline_at, created_at, completed_at
		FROM test_sessions WHERE id = $1
	`
	var s models.TestSession
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel,
		&s.Mode,
		&s.OverallScore, &s.ReadingScore, &s.ListeningScore, &s.WritingScore, &s.SpeakingScore,
		&s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore,
		&s.DeadlineAt, &s.CreatedAt, &s.CompletedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepo) Update(ctx context.Context, s *models.TestSession) error {
	query := `
		UPDATE test_sessions
		SET status = $1, current_stage = $2, stage_name = $3, difficulty_level = $4,
		    overall_score = $5, reading_score = $6, listening_score = $7, writing_score = $8, speaking_score = $9,
		    literacy_score = $10, comprehension_score = $11, production_score = $12, conversation_score = $13,
		    deadline_at = $14, completed_at = $15
		WHERE id = $16
	`
	_, err := r.db.ExecContext(ctx, query,
		s.Status, s.CurrentStage, s.StageName, s.DifficultyLevel,
		s.OverallScore, s.ReadingScore, s.ListeningScore, s.WritingScore, s.SpeakingScore,
		s.LiteracyScore, s.ComprehensionScore, s.ProductionScore, s.ConversationScore,
		s.DeadlineAt, s.CompletedAt, s.ID,
	)
	return err
}

func (r *SessionRepo) AssignQuestions(ctx context.Context, assignments []models.SessionQuestion) error {
	if len(assignments) == 0 {
		return nil
	}
	query := `
		INSERT INTO session_questions (session_id, question_id, stage_name, position, issued_at, deadline_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (session_id, question_id) DO NOTHING
	`
	for _, assignment := range assignments {
		if _, err := r.db.ExecContext(ctx, query,
			assignment.SessionID, assignment.QuestionID, assignment.StageName,
			assignment.Position, assignment.IssuedAt, assignment.DeadlineAt,
		); err != nil {
			return err
		}
	}
	return nil
}

func (r *SessionRepo) GetAssignedQuestions(ctx context.Context, sessionID, stageName string) ([]models.SessionQuestion, error) {
	query := `
		SELECT session_id, question_id, stage_name, position, issued_at, deadline_at
		FROM session_questions
		WHERE session_id = $1
	`
	args := []interface{}{sessionID}
	if stageName != "" {
		query += " AND stage_name = $2"
		args = append(args, stageName)
	}
	query += " ORDER BY position ASC, question_id ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	assignments := []models.SessionQuestion{}
	for rows.Next() {
		var assignment models.SessionQuestion
		if err := rows.Scan(&assignment.SessionID, &assignment.QuestionID, &assignment.StageName,
			&assignment.Position, &assignment.IssuedAt, &assignment.DeadlineAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, assignment)
	}
	return assignments, rows.Err()
}

func (r *SessionRepo) GetAllAssignedQuestions(ctx context.Context, sessionID string) ([]models.SessionQuestion, error) {
	return r.GetAssignedQuestions(ctx, sessionID, "")
}

func (r *SessionRepo) GetAssignedQuestion(ctx context.Context, sessionID, questionID string) (*models.SessionQuestion, error) {
	query := `
		SELECT session_id, question_id, stage_name, position, issued_at, deadline_at
		FROM session_questions
		WHERE session_id = $1 AND question_id = $2
	`
	var assignment models.SessionQuestion
	if err := r.db.QueryRowContext(ctx, query, sessionID, questionID).Scan(
		&assignment.SessionID, &assignment.QuestionID, &assignment.StageName,
		&assignment.Position, &assignment.IssuedAt, &assignment.DeadlineAt,
	); err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *SessionRepo) RecordEvent(ctx context.Context, event *models.SessionEvent) error {
	query := `
		INSERT INTO session_events (id, session_id, event_type, stage_name, question_id, payload, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	payload := event.Payload
	if len(payload) == 0 {
		payload = []byte(`{}`)
	}
	_, err := r.db.ExecContext(ctx, query, event.ID, event.SessionID, event.EventType, event.StageName, event.QuestionID, payload, event.CreatedAt)
	return err
}

func (r *SessionRepo) GetSessionEvents(ctx context.Context, sessionID string) ([]models.SessionEvent, error) {
	query := `
		SELECT id, session_id, event_type, stage_name, COALESCE(question_id, ''), payload, created_at
		FROM session_events
		WHERE session_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	events := []models.SessionEvent{}
	for rows.Next() {
		var event models.SessionEvent
		var payload []byte
		if err := rows.Scan(&event.ID, &event.SessionID, &event.EventType, &event.StageName, &event.QuestionID, &payload, &event.CreatedAt); err != nil {
			return nil, err
		}
		event.Payload = payload
		events = append(events, event)
	}
	return events, rows.Err()
}

func (r *SessionRepo) WithSessionLock(ctx context.Context, sessionID string, fn func() error) error {
	conn, err := r.db.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()

	if _, err := conn.ExecContext(ctx, `SELECT pg_advisory_lock(hashtext($1))`, sessionID); err != nil {
		return err
	}
	defer func() {
		_, _ = conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock(hashtext($1))`, sessionID)
	}()

	return fn()
}

func (r *SessionRepo) RecordResponse(ctx context.Context, resp *models.QuestionResponse) error {
	query := `
		INSERT INTO question_responses (id, session_id, question_id, user_response, is_correct, raw_score, time_spent_sec, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (session_id, question_id) DO UPDATE SET
			user_response = EXCLUDED.user_response,
			is_correct = EXCLUDED.is_correct,
			raw_score = EXCLUDED.raw_score,
			time_spent_sec = EXCLUDED.time_spent_sec
	`
	_, err := r.db.ExecContext(ctx, query, resp.ID, resp.SessionID, resp.QuestionID, resp.UserResponse, resp.IsCorrect, resp.RawScore, resp.TimeSpentSec, resp.CreatedAt)
	return err
}

func (r *SessionRepo) UpdateResponseScore(ctx context.Context, sessionID, questionID string, rawScore float64, isCorrect bool) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE question_responses SET raw_score = $1, is_correct = $2
		WHERE session_id = $3 AND question_id = $4
	`, rawScore, isCorrect, sessionID, questionID)
	return err
}

func (r *SessionRepo) GetSessionResponses(ctx context.Context, sessionID string) ([]models.QuestionResponse, error) {
	query := `SELECT id, session_id, question_id, user_response, is_correct, raw_score, time_spent_sec, created_at FROM question_responses WHERE session_id = $1`
	rows, err := r.db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []models.QuestionResponse
	for rows.Next() {
		var q models.QuestionResponse
		var respBytes []byte
		if err := rows.Scan(&q.ID, &q.SessionID, &q.QuestionID, &respBytes, &q.IsCorrect, &q.RawScore, &q.TimeSpentSec, &q.CreatedAt); err != nil {
			return nil, err
		}
		q.UserResponse = respBytes
		responses = append(responses, q)
	}
	return responses, nil
}

func (r *SessionRepo) GetUserSessions(ctx context.Context, userID string) ([]models.TestSession, error) {
	query := `SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, COALESCE(mode, 'full'), overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, deadline_at, created_at, completed_at FROM test_sessions WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.TestSession
	for rows.Next() {
		var s models.TestSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel, &s.Mode, &s.OverallScore, &s.ReadingScore, &s.ListeningScore, &s.WritingScore, &s.SpeakingScore, &s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore, &s.DeadlineAt, &s.CreatedAt, &s.CompletedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepo) ListRecent(ctx context.Context, limit int) ([]models.TestSession, error) {
	query := `SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, COALESCE(mode, 'full'), overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, deadline_at, created_at, completed_at FROM test_sessions ORDER BY created_at DESC LIMIT $1`
	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.TestSession
	for rows.Next() {
		var s models.TestSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel, &s.Mode, &s.OverallScore, &s.ReadingScore, &s.ListeningScore, &s.WritingScore, &s.SpeakingScore, &s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore, &s.DeadlineAt, &s.CreatedAt, &s.CompletedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepo) GetStats(ctx context.Context) (int, int, float64, map[string]int, error) {
	var total, completed int
	var avgScore sql.NullFloat64

	_ = r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM test_sessions`).Scan(&total)
	_ = r.db.QueryRowContext(ctx, `SELECT COUNT(*), AVG(overall_score) FROM test_sessions WHERE status = 'COMPLETED'`).Scan(&completed, &avgScore)

	scoreDist := map[string]int{
		"10-60 (A2)":    0,
		"65-95 (B1)":    0,
		"100-125 (B2)":  0,
		"130-160 (C1+)": 0,
	}

	rows, err := r.db.QueryContext(ctx, `SELECT overall_score FROM test_sessions WHERE status = 'COMPLETED' AND overall_score IS NOT NULL`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var sc int
			if err := rows.Scan(&sc); err == nil {
				if sc < 65 {
					scoreDist["10-60 (A2)"]++
				} else if sc < 100 {
					scoreDist["65-95 (B1)"]++
				} else if sc < 130 {
					scoreDist["100-125 (B2)"]++
				} else {
					scoreDist["130-160 (C1+)"]++
				}
			}
		}
	}

	avg := 0.0
	if avgScore.Valid {
		avg = avgScore.Float64
	}

	return total, completed, avg, scoreDist, nil
}

func (r *SessionRepo) SaveEvaluation(ctx context.Context, eval *models.EvaluationResult) error {
	query := `
		INSERT INTO evaluations (
			id, response_id, session_id, question_id, question_type, status, score,
			word_count, unique_words, lexical_diversity, academic_words, connectors,
			relevance_score, cefr_level, speaking_duration, wpm, recommendations,
			audio_url, transcript, transcript_source, provider, evaluator_version,
			feedback_status, feedback, evidence_spans, retry_count, last_error, created_at
		) VALUES (
			$1, NULLIF($2, '')::uuid, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17,
			$18, $19, $20, $21, $22,
			$23, $24, $25, $26, $27, $28
		)
		ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			score = EXCLUDED.score,
			transcript = EXCLUDED.transcript,
			transcript_source = EXCLUDED.transcript_source,
			provider = EXCLUDED.provider,
			evaluator_version = EXCLUDED.evaluator_version,
			feedback_status = EXCLUDED.feedback_status,
			feedback = EXCLUDED.feedback,
			evidence_spans = EXCLUDED.evidence_spans,
			retry_count = EXCLUDED.retry_count,
			last_error = EXCLUDED.last_error
	`
	academicJSON, _ := json.Marshal(eval.AcademicWords)
	connectorsJSON, _ := json.Marshal(eval.Connectors)
	recsJSON, _ := json.Marshal(eval.Recommendations)
	evidenceJSON, _ := json.Marshal(eval.EvidenceSpans)

	_, err := r.db.ExecContext(ctx, query,
		eval.ID, eval.ResponseID, eval.SessionID, eval.QuestionID, eval.QuestionType, eval.Status, eval.Score,
		eval.WordCount, eval.UniqueWords, eval.LexicalDiversity, academicJSON, connectorsJSON,
		eval.RelevanceScore, eval.CEFRLevel, eval.SpeakingDuration, eval.WPM, recsJSON,
		eval.AudioURL, eval.Transcript, eval.TranscriptSource, eval.Provider, eval.EvaluatorVersion,
		eval.FeedbackStatus, eval.Feedback, evidenceJSON, eval.RetryCount, eval.LastError, eval.CreatedAt,
	)
	return err
}

func (r *SessionRepo) GetSessionEvaluations(ctx context.Context, sessionID string) ([]models.EvaluationResult, error) {
	query := `
		SELECT id, COALESCE(response_id::text, ''), session_id, question_id, question_type, status, score,
		       word_count, unique_words, lexical_diversity, academic_words, connectors,
		       relevance_score, cefr_level, speaking_duration, wpm, recommendations,
		       audio_url, transcript, transcript_source, provider, evaluator_version,
		       feedback_status, feedback, evidence_spans, retry_count, last_error, created_at
		FROM evaluations WHERE session_id = $1 ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var evals []models.EvaluationResult
	for rows.Next() {
		var e models.EvaluationResult
		var academicJSON, connectorsJSON, recsJSON, evidenceJSON []byte
		if err := rows.Scan(
			&e.ID, &e.ResponseID, &e.SessionID, &e.QuestionID, &e.QuestionType, &e.Status, &e.Score,
			&e.WordCount, &e.UniqueWords, &e.LexicalDiversity, &academicJSON, &connectorsJSON,
			&e.RelevanceScore, &e.CEFRLevel, &e.SpeakingDuration, &e.WPM, &recsJSON,
			&e.AudioURL, &e.Transcript, &e.TranscriptSource, &e.Provider, &e.EvaluatorVersion,
			&e.FeedbackStatus, &e.Feedback, &evidenceJSON, &e.RetryCount, &e.LastError, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(academicJSON, &e.AcademicWords)
		_ = json.Unmarshal(connectorsJSON, &e.Connectors)
		_ = json.Unmarshal(recsJSON, &e.Recommendations)
		_ = json.Unmarshal(evidenceJSON, &e.EvidenceSpans)
		evals = append(evals, e)
	}
	return evals, nil
}

func (r *SessionRepo) UpdateEvaluation(ctx context.Context, eval *models.EvaluationResult) error {
	return r.SaveEvaluation(ctx, eval)
}

func (r *SessionRepo) CreateEvaluationJob(ctx context.Context, job *models.EvaluationJob) error {
	query := `
		INSERT INTO evaluation_jobs
			(id, session_id, question_id, evaluation_id, audio_path, audio_mime, client_transcript, mode,
			 status, attempts, max_attempts, next_attempt_at, last_error, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := r.db.ExecContext(ctx, query,
		job.ID, job.SessionID, job.QuestionID, job.EvaluationID, job.AudioPath, job.AudioMIME,
		job.ClientTranscript, job.Mode, job.Status, job.Attempts, job.MaxAttempts, job.NextAttemptAt,
		job.LastError, job.CreatedAt, job.UpdatedAt,
	)
	return err
}

func (r *SessionRepo) ClaimEvaluationJob(ctx context.Context) (*models.EvaluationJob, error) {
	query := `
		WITH claimed AS (
			SELECT id FROM evaluation_jobs
			WHERE (
				(status IN ('queued', 'retryable_failed') AND next_attempt_at <= NOW())
				OR (status = 'processing' AND attempts < max_attempts AND updated_at < NOW() - INTERVAL '2 minutes')
			)
			ORDER BY created_at ASC
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		UPDATE evaluation_jobs j
		SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
		FROM claimed
		WHERE j.id = claimed.id
		RETURNING j.id, j.session_id, j.question_id, j.evaluation_id, j.audio_path, j.audio_mime,
		          j.client_transcript, j.mode, j.status, j.attempts, j.max_attempts,
		          j.next_attempt_at, j.last_error, j.created_at, j.updated_at
	`
	var job models.EvaluationJob
	err := r.db.QueryRowContext(ctx, query).Scan(
		&job.ID, &job.SessionID, &job.QuestionID, &job.EvaluationID, &job.AudioPath,
		&job.AudioMIME, &job.ClientTranscript, &job.Mode, &job.Status, &job.Attempts, &job.MaxAttempts,
		&job.NextAttemptAt, &job.LastError, &job.CreatedAt, &job.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *SessionRepo) CompleteEvaluationJob(ctx context.Context, jobID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE evaluation_jobs SET status = 'completed', updated_at = NOW() WHERE id = $1`, jobID)
	return err
}

func (r *SessionRepo) FailEvaluationJob(ctx context.Context, jobID string, retryAt time.Time, lastError string) error {
	query := `
		UPDATE evaluation_jobs
		SET status = CASE WHEN attempts >= max_attempts THEN 'permanently_failed' ELSE 'retryable_failed' END,
		    next_attempt_at = $2,
		    last_error = $3,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.ExecContext(ctx, query, jobID, retryAt, lastError)
	return err
}

func (r *SessionRepo) ReapStaleEvaluationJobs(ctx context.Context) (int, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE evaluation_jobs
		SET status = 'permanently_failed',
		    last_error = CASE WHEN last_error = '' THEN 'processing lease expired after max attempts' ELSE last_error END,
		    updated_at = NOW()
		WHERE status = 'processing'
		  AND attempts >= max_attempts
		  AND updated_at < NOW() - INTERVAL '2 minutes'
	`)
	if err != nil {
		return 0, err
	}
	count, _ := res.RowsAffected()
	return int(count), nil
}

func (r *SessionRepo) EvaluationQueueStats(ctx context.Context) (*models.EvaluationQueueStats, error) {
	var stats models.EvaluationQueueStats
	err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status = 'queued'),
			COUNT(*) FILTER (WHERE status = 'processing'),
			COUNT(*) FILTER (WHERE status = 'retryable_failed'),
			COUNT(*) FILTER (WHERE status = 'permanently_failed'),
			COALESCE(EXTRACT(EPOCH FROM (NOW() - MIN(created_at) FILTER (WHERE status = 'processing'))), 0)::bigint
		FROM evaluation_jobs
	`).Scan(&stats.Queued, &stats.Processing, &stats.RetryableFailed, &stats.PermanentlyFailed, &stats.OldestProcessingAgeSec)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *SessionRepo) CountPendingEvaluationJobs(ctx context.Context, sessionID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM evaluation_jobs
		WHERE session_id = $1 AND status IN ('queued', 'processing', 'retryable_failed')
	`, sessionID).Scan(&count)
	return count, err
}

func (r *SessionRepo) SaveMediaAsset(ctx context.Context, asset *models.MediaAsset) error {
	query := `
		INSERT INTO media_assets (
			id, user_id, session_id, question_id, file_type, file_path, url, file_size, duration_sec, created_at
		) VALUES (
			$1, $2, NULLIF($3, '')::uuid, $4, $5, $6, $7, $8, $9, $10
		)
	`
	_, err := r.db.ExecContext(ctx, query,
		asset.ID, asset.UserID, asset.SessionID, asset.QuestionID, asset.FileType, asset.FilePath, asset.URL, asset.FileSize, asset.DurationSec, asset.CreatedAt,
	)
	return err
}

func (r *SessionRepo) DeleteMediaAssetsBySession(ctx context.Context, sessionID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `DELETE FROM media_assets WHERE session_id = $1 RETURNING file_path`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	paths := []string{}
	for rows.Next() {
		var path sql.NullString
		if err := rows.Scan(&path); err != nil {
			return nil, err
		}
		if path.Valid && path.String != "" {
			paths = append(paths, path.String)
		}
	}
	return paths, rows.Err()
}

func (r *SessionRepo) GetMediaAssetByID(ctx context.Context, id string) (*models.MediaAsset, error) {
	query := `
		SELECT id, user_id, COALESCE(session_id::text, ''), question_id, file_type, file_path, url, file_size, duration_sec, created_at
		FROM media_assets WHERE id = $1
	`
	var a models.MediaAsset
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&a.ID, &a.UserID, &a.SessionID, &a.QuestionID, &a.FileType, &a.FilePath, &a.URL, &a.FileSize, &a.DurationSec, &a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// --- Certificates ---

type CertRepo struct{ db *sql.DB }

func (r *CertRepo) Create(ctx context.Context, c *models.Certificate) error {
	query := `
		INSERT INTO certificates (id, user_id, test_session_id, candidate_name, overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := r.db.ExecContext(ctx, query, c.ID, c.UserID, c.TestSessionID, c.CandidateName, c.OverallScore, c.ReadingScore, c.ListeningScore, c.WritingScore, c.SpeakingScore, c.LiteracyScore, c.ComprehensionScore, c.ProductionScore, c.ConversationScore, c.IssuedAt, c.PDFURL)
	return err
}

func (r *CertRepo) GetByID(ctx context.Context, id string) (*models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE id = $1`
	var c models.Certificate
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.ReadingScore, &c.ListeningScore, &c.WritingScore, &c.SpeakingScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL,
	)
	if err != nil {
		return nil, err
	}
	c.IsVerified = true
	return &c, nil
}

func (r *CertRepo) GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []models.Certificate
	for rows.Next() {
		var c models.Certificate
		if err := rows.Scan(&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.ReadingScore, &c.ListeningScore, &c.WritingScore, &c.SpeakingScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL); err != nil {
			return nil, err
		}
		c.IsVerified = true
		certs = append(certs, c)
	}
	return certs, nil
}

func (r *CertRepo) GetBySessionID(ctx context.Context, sessionID string) (*models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, reading_score, listening_score, writing_score, speaking_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE test_session_id = $1`
	var c models.Certificate
	err := r.db.QueryRowContext(ctx, query, sessionID).Scan(
		&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.ReadingScore, &c.ListeningScore, &c.WritingScore, &c.SpeakingScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL,
	)
	if err != nil {
		return nil, err
	}
	c.IsVerified = true
	return &c, nil
}

func (r *CertRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM certificates`).Scan(&count)
	return count, err
}

// --- Banners ---

type BannerRepo struct{ db *sql.DB }

func (r *BannerRepo) GetActiveByPlacement(ctx context.Context, placement string) ([]models.AdBanner, error) {
	query := `SELECT id, placement, image_url, target_url, alt_text, is_active, impressions, clicks, created_at FROM ad_banners WHERE is_active = true`
	var args []interface{}
	if placement != "" {
		query += " AND placement = $1"
		args = append(args, placement)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []models.AdBanner
	for rows.Next() {
		var b models.AdBanner
		if err := rows.Scan(&b.ID, &b.Placement, &b.ImageURL, &b.TargetURL, &b.AltText, &b.IsActive, &b.Impressions, &b.Clicks, &b.CreatedAt); err != nil {
			return nil, err
		}
		banners = append(banners, b)
	}
	return banners, nil
}

func (r *BannerRepo) ListAll(ctx context.Context) ([]models.AdBanner, error) {
	query := `SELECT id, placement, image_url, target_url, alt_text, is_active, impressions, clicks, created_at FROM ad_banners ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []models.AdBanner
	for rows.Next() {
		var b models.AdBanner
		if err := rows.Scan(&b.ID, &b.Placement, &b.ImageURL, &b.TargetURL, &b.AltText, &b.IsActive, &b.Impressions, &b.Clicks, &b.CreatedAt); err != nil {
			return nil, err
		}
		banners = append(banners, b)
	}
	return banners, nil
}

func (r *BannerRepo) Create(ctx context.Context, b *models.AdBanner) error {
	query := `INSERT INTO ad_banners (id, placement, image_url, target_url, alt_text, is_active, impressions, clicks, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.ExecContext(ctx, query, b.ID, b.Placement, b.ImageURL, b.TargetURL, b.AltText, b.IsActive, b.Impressions, b.Clicks, b.CreatedAt)
	return err
}

func (r *BannerRepo) Update(ctx context.Context, b *models.AdBanner) error {
	query := `UPDATE ad_banners SET placement = $1, image_url = $2, target_url = $3, alt_text = $4, is_active = $5 WHERE id = $6`
	_, err := r.db.ExecContext(ctx, query, b.Placement, b.ImageURL, b.TargetURL, b.AltText, b.IsActive, b.ID)
	return err
}

func (r *BannerRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM ad_banners WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *BannerRepo) RecordClick(ctx context.Context, id string) error {
	query := `UPDATE ad_banners SET clicks = clicks + 1 WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *BannerRepo) RecordImpression(ctx context.Context, id string) error {
	query := `UPDATE ad_banners SET impressions = impressions + 1 WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *BannerRepo) GetStats(ctx context.Context) (int, int, error) {
	var active, clicks int
	_ = r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM ad_banners WHERE is_active = true`).Scan(&active)
	_ = r.db.QueryRowContext(ctx, `SELECT COALESCE(SUM(clicks), 0) FROM ad_banners`).Scan(&clicks)
	return active, clicks, nil
}

// --- Institutions ---

type InstitutionRepo struct{ db *sql.DB }

func (r *InstitutionRepo) List(ctx context.Context, search, country string, minScore int, category string) ([]models.Institution, error) {
	query := `SELECT id, name, country, city, state, min_score, subscore_reqs, latitude, longitude, website_url, logo_url, category, acceptance_rate, programs, created_at FROM institutions WHERE 1=1`
	var args []interface{}
	idx := 1

	if minScore > 0 {
		query += fmt.Sprintf(" AND min_score <= $%d", idx)
		args = append(args, minScore)
		idx++
	}
	if country != "" {
		query += fmt.Sprintf(" AND LOWER(country) LIKE $%d", idx)
		args = append(args, "%"+strings.ToLower(country)+"%")
		idx++
	}
	if category != "" {
		query += fmt.Sprintf(" AND LOWER(category) LIKE $%d", idx)
		args = append(args, "%"+strings.ToLower(category)+"%")
		idx++
	}
	if search != "" {
		query += fmt.Sprintf(" AND (LOWER(name) LIKE $%d OR LOWER(city) LIKE $%d OR LOWER(country) LIKE $%d)", idx, idx, idx)
		args = append(args, "%"+strings.ToLower(search)+"%")
		idx++
	}

	query += " ORDER BY min_score DESC, name ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Institution
	for rows.Next() {
		var inst models.Institution
		var programs pq.StringArray
		if err := rows.Scan(
			&inst.ID, &inst.Name, &inst.Country, &inst.City, &inst.State,
			&inst.MinScore, &inst.SubscoreReqs, &inst.Latitude, &inst.Longitude,
			&inst.WebsiteURL, &inst.LogoURL, &inst.Category, &inst.AcceptanceRate,
			&programs, &inst.CreatedAt,
		); err != nil {
			return nil, err
		}
		inst.Programs = []string(programs)
		list = append(list, inst)
	}

	return list, nil
}

func (r *InstitutionRepo) GetByID(ctx context.Context, id string) (*models.Institution, error) {
	query := `SELECT id, name, country, city, state, min_score, subscore_reqs, latitude, longitude, website_url, logo_url, category, acceptance_rate, programs, created_at FROM institutions WHERE id = $1`
	var inst models.Institution
	var programs pq.StringArray
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&inst.ID, &inst.Name, &inst.Country, &inst.City, &inst.State,
		&inst.MinScore, &inst.SubscoreReqs, &inst.Latitude, &inst.Longitude,
		&inst.WebsiteURL, &inst.LogoURL, &inst.Category, &inst.AcceptanceRate,
		&programs, &inst.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	inst.Programs = []string(programs)
	return &inst, nil
}

func (r *InstitutionRepo) Create(ctx context.Context, inst *models.Institution) error {
	query := `
		INSERT INTO institutions (id, name, country, city, state, min_score, subscore_reqs, latitude, longitude, website_url, logo_url, category, acceptance_rate, programs, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := r.db.ExecContext(ctx, query,
		inst.ID, inst.Name, inst.Country, inst.City, inst.State,
		inst.MinScore, inst.SubscoreReqs, inst.Latitude, inst.Longitude,
		inst.WebsiteURL, inst.LogoURL, inst.Category, inst.AcceptanceRate,
		pq.Array(inst.Programs), inst.CreatedAt,
	)
	return err
}

func (r *InstitutionRepo) Update(ctx context.Context, inst *models.Institution) error {
	query := `
		UPDATE institutions
		SET name = $1, country = $2, city = $3, state = $4, min_score = $5,
		    subscore_reqs = $6, latitude = $7, longitude = $8, website_url = $9,
		    logo_url = $10, category = $11, acceptance_rate = $12, programs = $13
		WHERE id = $14
	`
	_, err := r.db.ExecContext(ctx, query,
		inst.Name, inst.Country, inst.City, inst.State, inst.MinScore,
		inst.SubscoreReqs, inst.Latitude, inst.Longitude, inst.WebsiteURL,
		inst.LogoURL, inst.Category, inst.AcceptanceRate, pq.Array(inst.Programs), inst.ID,
	)
	return err
}

func (r *InstitutionRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM institutions WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *InstitutionRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM institutions`).Scan(&count)
	return count, err
}

// --- Study, Goals, Error Notebook and SRS ---

type StudyRepo struct{ db *sql.DB }

func (r *StudyRepo) GetGoals(ctx context.Context, userID string) (*models.UserGoal, error) {
	query := `
		SELECT user_id, target_score, target_date, daily_minutes, COALESCE(target_university_id, ''), updated_at
		FROM user_goals
		WHERE user_id = $1
	`
	var g models.UserGoal
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&g.UserID, &g.TargetScore, &g.TargetDate, &g.DailyMinutes, &g.TargetUniversityID, &g.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		// "No goal yet" is a normal state: the student has not chosen a target.
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *StudyRepo) UpsertGoals(ctx context.Context, goal *models.UserGoal) error {
	query := `
		INSERT INTO user_goals (user_id, target_score, target_date, daily_minutes, target_university_id, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			target_score = EXCLUDED.target_score,
			target_date = EXCLUDED.target_date,
			daily_minutes = EXCLUDED.daily_minutes,
			target_university_id = EXCLUDED.target_university_id,
			updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query,
		goal.UserID, goal.TargetScore, goal.TargetDate, goal.DailyMinutes, goal.TargetUniversityID,
	)
	return err
}

func (r *StudyRepo) GetErrors(ctx context.Context, userID string) ([]models.UserErrorItem, error) {
	query := `
		SELECT id, user_id, question_type, prompt, user_answer, correct_answer,
		       COALESCE(explanation, ''), consecutive_successes, attempts_count,
		       mastered, last_reviewed_at, created_at
		FROM user_errors
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var errors []models.UserErrorItem
	for rows.Next() {
		var item models.UserErrorItem
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.QuestionType, &item.Prompt, &item.UserAnswer, &item.CorrectAnswer,
			&item.Explanation, &item.ConsecutiveSuccesses, &item.AttemptsCount,
			&item.Mastered, &item.LastReviewedAt, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		errors = append(errors, item)
	}
	if errors == nil {
		errors = []models.UserErrorItem{}
	}
	return errors, rows.Err()
}

func (r *StudyRepo) GetErrorByID(ctx context.Context, userID, errorID string) (*models.UserErrorItem, error) {
	query := `
		SELECT id, user_id, question_type, prompt, user_answer, correct_answer,
		       COALESCE(explanation, ''), consecutive_successes, attempts_count,
		       mastered, last_reviewed_at, created_at
		FROM user_errors
		WHERE user_id = $1 AND id = $2
	`
	var item models.UserErrorItem
	err := r.db.QueryRowContext(ctx, query, userID, errorID).Scan(
		&item.ID, &item.UserID, &item.QuestionType, &item.Prompt, &item.UserAnswer, &item.CorrectAnswer,
		&item.Explanation, &item.ConsecutiveSuccesses, &item.AttemptsCount,
		&item.Mastered, &item.LastReviewedAt, &item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *StudyRepo) SaveError(ctx context.Context, item *models.UserErrorItem) error {
	query := `
		INSERT INTO user_errors (
			id, user_id, question_type, prompt, user_answer, correct_answer,
			explanation, consecutive_successes, attempts_count, mastered, last_reviewed_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			user_answer = EXCLUDED.user_answer,
			consecutive_successes = EXCLUDED.consecutive_successes,
			attempts_count = EXCLUDED.attempts_count,
			mastered = EXCLUDED.mastered,
			last_reviewed_at = EXCLUDED.last_reviewed_at
	`
	_, err := r.db.ExecContext(ctx, query,
		item.ID, item.UserID, item.QuestionType, item.Prompt, item.UserAnswer, item.CorrectAnswer,
		item.Explanation, item.ConsecutiveSuccesses, item.AttemptsCount, item.Mastered, item.LastReviewedAt, item.CreatedAt,
	)
	return err
}

func (r *StudyRepo) DeleteError(ctx context.Context, userID, errorID string) error {
	query := `DELETE FROM user_errors WHERE user_id = $1 AND id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, errorID)
	return err
}

func (r *StudyRepo) RecordActivity(ctx context.Context, userID, activityDate, source string) error {
	query := `
		INSERT INTO user_activity (user_id, activity_date, source)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, activity_date) DO UPDATE SET source = EXCLUDED.source
	`
	_, err := r.db.ExecContext(ctx, query, userID, activityDate, source)
	return err
}

func (r *StudyRepo) GetActivityDates(ctx context.Context, userID string, limit int) ([]string, error) {
	query := `
		SELECT activity_date::text
		FROM user_activity
		WHERE user_id = $1
		ORDER BY activity_date DESC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	dates := []string{}
	for rows.Next() {
		var date string
		if err := rows.Scan(&date); err != nil {
			return nil, err
		}
		dates = append(dates, date)
	}
	return dates, rows.Err()
}

func (r *StudyRepo) CompletePlanTask(ctx context.Context, userID, taskID, taskDate, source string) error {
	query := `
		INSERT INTO study_plan_task_completions (user_id, task_id, task_date, source, completed_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, task_id, task_date) DO UPDATE SET
			source = EXCLUDED.source,
			completed_at = EXCLUDED.completed_at
	`
	_, err := r.db.ExecContext(ctx, query, userID, taskID, taskDate, source)
	return err
}

func (r *StudyRepo) GetPlanTaskCompletions(ctx context.Context, userID, taskDate string) (map[string]time.Time, error) {
	query := `SELECT task_id, completed_at FROM study_plan_task_completions WHERE user_id = $1 AND task_date = $2`
	rows, err := r.db.QueryContext(ctx, query, userID, taskDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := map[string]time.Time{}
	for rows.Next() {
		var taskID string
		var completedAt time.Time
		if err := rows.Scan(&taskID, &completedAt); err != nil {
			return nil, err
		}
		result[taskID] = completedAt
	}
	return result, rows.Err()
}

func (r *StudyRepo) GetSRSStats(ctx context.Context, userID string) (*models.SRSStats, error) {
	query := `
		SELECT streak_days, COALESCE(last_studied_date, ''), total_reviewed
		FROM user_srs_stats
		WHERE user_id = $1
	`
	var stats models.SRSStats
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&stats.StreakDays, &stats.LastStudiedDate, &stats.TotalReviewed,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return &models.SRSStats{StreakDays: 0, LastStudiedDate: "", TotalReviewed: 0}, nil
		}
		return nil, err
	}
	return &stats, nil
}

func (r *StudyRepo) SaveSRSStats(ctx context.Context, userID string, stats *models.SRSStats) error {
	query := `
		INSERT INTO user_srs_stats (user_id, streak_days, last_studied_date, total_reviewed, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			streak_days = EXCLUDED.streak_days,
			last_studied_date = EXCLUDED.last_studied_date,
			total_reviewed = EXCLUDED.total_reviewed,
			updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query,
		userID, stats.StreakDays, stats.LastStudiedDate, stats.TotalReviewed,
	)
	return err
}

func (r *StudyRepo) GetSRSCards(ctx context.Context, userID string) (map[string]models.SRSCardProgress, error) {
	query := `
		SELECT card_id, interval_days, repetitions, easiness_factor, due_date, last_reviewed_at
		FROM user_srs_cards
		WHERE user_id = $1
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cards := make(map[string]models.SRSCardProgress)
	for rows.Next() {
		var c models.SRSCardProgress
		if err := rows.Scan(
			&c.CardID, &c.IntervalDays, &c.Repetitions, &c.EasinessFactor, &c.DueDate, &c.LastReviewedAt,
		); err != nil {
			return nil, err
		}
		cards[c.CardID] = c
	}
	return cards, rows.Err()
}

func (r *StudyRepo) SaveSRSCard(ctx context.Context, userID string, card *models.SRSCardProgress) error {
	query := `
		INSERT INTO user_srs_cards (user_id, card_id, interval_days, repetitions, easiness_factor, due_date, last_reviewed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, card_id) DO UPDATE SET
			interval_days = EXCLUDED.interval_days,
			repetitions = EXCLUDED.repetitions,
			easiness_factor = EXCLUDED.easiness_factor,
			due_date = EXCLUDED.due_date,
			last_reviewed_at = EXCLUDED.last_reviewed_at
	`
	_, err := r.db.ExecContext(ctx, query,
		userID, card.CardID, card.IntervalDays, card.Repetitions, card.EasinessFactor, card.DueDate, card.LastReviewedAt,
	)
	return err
}

// --- Vocabulary ---

type VocabularyRepo struct{ db *sql.DB }

func (r *VocabularyRepo) List(ctx context.Context, search, level string) ([]models.VocabularyEntry, error) {
	query := `
		SELECT id, word, COALESCE(ipa, ''), COALESCE(pos, ''), level, meaning_ru,
		       definition_en, COALESCE(example, ''), collocations, source,
		       COALESCE(source_url, ''), status, version, reviewed_at
		FROM vocabulary_entries
		WHERE status = 'published'
	`
	args := []interface{}{}
	idx := 1
	if search != "" {
		query += fmt.Sprintf(" AND (LOWER(word) LIKE $%d OR LOWER(meaning_ru) LIKE $%d OR LOWER(definition_en) LIKE $%d)", idx, idx, idx)
		pattern := "%" + strings.ToLower(search) + "%"
		args = append(args, pattern)
		idx++
	}
	if level != "" && level != "ALL" {
		query += fmt.Sprintf(" AND level = $%d", idx)
		args = append(args, level)
	}
	query += " ORDER BY word ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := []models.VocabularyEntry{}
	for rows.Next() {
		var entry models.VocabularyEntry
		var collocations []byte
		if err := rows.Scan(
			&entry.ID, &entry.Word, &entry.IPA, &entry.PartOfSpeech, &entry.Level,
			&entry.MeaningRu, &entry.DefinitionEn, &entry.Example, &collocations,
			&entry.Source, &entry.SourceURL, &entry.Status, &entry.Version, &entry.ReviewedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(collocations, &entry.Collocations)
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func (r *VocabularyRepo) ListAll(ctx context.Context) ([]models.VocabularyEntry, error) {
	query := `
		SELECT id, word, COALESCE(ipa, ''), COALESCE(pos, ''), level, meaning_ru,
		       definition_en, COALESCE(example, ''), collocations, source,
		       COALESCE(source_url, ''), status, version, reviewed_at
		FROM vocabulary_entries
		ORDER BY status ASC, word ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	entries := []models.VocabularyEntry{}
	for rows.Next() {
		var entry models.VocabularyEntry
		var collocations []byte
		if err := rows.Scan(&entry.ID, &entry.Word, &entry.IPA, &entry.PartOfSpeech, &entry.Level,
			&entry.MeaningRu, &entry.DefinitionEn, &entry.Example, &collocations,
			&entry.Source, &entry.SourceURL, &entry.Status, &entry.Version, &entry.ReviewedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(collocations, &entry.Collocations)
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func (r *VocabularyRepo) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE vocabulary_entries SET status = $1, reviewed_at = NOW() WHERE id = $2`, status, id)
	return err
}

func (r *VocabularyRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM vocabulary_entries WHERE status = 'published'`).Scan(&count)
	return count, err
}

// --- OAuth transactions ---

type OAuthTransactionRepo struct{ db *sql.DB }

func (r *OAuthTransactionRepo) Create(ctx context.Context, transaction *models.OAuthTransaction) error {
	query := `
		INSERT INTO oauth_transactions
			(id, state_hash, nonce, pkce_verifier, provider, action, redirect_uri, user_id, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::uuid, $9, $10)
	`
	_, err := r.db.ExecContext(ctx, query,
		transaction.ID, transaction.StateHash, transaction.Nonce, transaction.PKCEVerifier,
		transaction.Provider, transaction.Action, transaction.RedirectURI, transaction.UserID,
		transaction.ExpiresAt, transaction.CreatedAt,
	)
	return err
}

func (r *OAuthTransactionRepo) Consume(ctx context.Context, stateHash, provider string) (*models.OAuthTransaction, error) {
	query := `
		UPDATE oauth_transactions
		SET consumed_at = NOW()
		WHERE state_hash = $1
		  AND provider = $2
		  AND consumed_at IS NULL
		  AND expires_at > NOW()
		RETURNING id, state_hash, nonce, pkce_verifier, provider, action, redirect_uri,
		          COALESCE(user_id::text, ''), expires_at, consumed_at, created_at
	`
	var transaction models.OAuthTransaction
	err := r.db.QueryRowContext(ctx, query, stateHash, provider).Scan(
		&transaction.ID, &transaction.StateHash, &transaction.Nonce, &transaction.PKCEVerifier,
		&transaction.Provider, &transaction.Action, &transaction.RedirectURI,
		&transaction.UserID, &transaction.ExpiresAt, &transaction.ConsumedAt, &transaction.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

func (r *OAuthTransactionRepo) CleanupExpired(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM oauth_transactions WHERE expires_at < NOW() - INTERVAL '1 hour'`)
	return err
}

func envOrDefaultMode(mode string) string {
	if mode == "" {
		return "full"
	}
	return mode
}

// --- Refresh tokens ---

type RefreshTokenRepo struct{ db *sql.DB }

func (r *RefreshTokenRepo) Create(ctx context.Context, token *models.RefreshToken) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, token.ID, token.UserID, token.TokenHash, token.ExpiresAt, token.CreatedAt)
	return err
}

func (r *RefreshTokenRepo) GetActiveByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
	`, tokenHash).Scan(&token.ID, &token.UserID, &token.TokenHash, &token.ExpiresAt, &token.RevokedAt, &token.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *RefreshTokenRepo) GetByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
		FROM refresh_tokens WHERE token_hash = $1
	`, tokenHash).Scan(&token.ID, &token.UserID, &token.TokenHash, &token.ExpiresAt, &token.RevokedAt, &token.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *RefreshTokenRepo) Revoke(ctx context.Context, tokenHash string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, tokenHash)
	return err
}

func (r *RefreshTokenRepo) RevokeAllForUser(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	return err
}
