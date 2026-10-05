package postgres

import (
	"context"
	"database/sql"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

type PostgresStorage struct {
	db           *sql.DB
	users        *UserRepo
	theory       *TheoryRepo
	questions    *QuestionRepo
	sessions     *SessionRepo
	certificates *CertRepo
	banners      *BannerRepo
	institutions *InstitutionRepo
}

func New(dbURL string) (*PostgresStorage, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	s := &PostgresStorage{
		db:           db,
		users:        &UserRepo{db: db},
		theory:       &TheoryRepo{db: db},
		questions:    &QuestionRepo{db: db},
		sessions:     &SessionRepo{db: db},
		certificates: &CertRepo{db: db},
		banners:      &BannerRepo{db: db},
		institutions: &InstitutionRepo{db: db},
	}

	return s, nil
}

func (s *PostgresStorage) Users() repository.UserRepository               { return s.users }
func (s *PostgresStorage) Theory() repository.TheoryRepository             { return s.theory }
func (s *PostgresStorage) Questions() repository.QuestionRepository       { return s.questions }
func (s *PostgresStorage) Sessions() repository.TestSessionRepository     { return s.sessions }
func (s *PostgresStorage) Certificates() repository.CertificateRepository { return s.certificates }
func (s *PostgresStorage) Banners() repository.BannerRepository           { return s.banners }
func (s *PostgresStorage) Institutions() repository.InstitutionRepository { return s.institutions }
func (s *PostgresStorage) Close() error                                   { return s.db.Close() }

// --- Users ---

type UserRepo struct{ db *sql.DB }

func (r *UserRepo) Create(ctx context.Context, u *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, name, role, avatar_url, locale, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	now := time.Now().UTC()
	u.CreatedAt = now
	u.UpdatedAt = now
	role := u.Role
	if role == "" {
		role = "student"
	}
	_, err := r.db.ExecContext(ctx, query, u.ID, u.Email, u.PasswordHash, u.Name, role, u.AvatarURL, u.Locale, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, created_at, updated_at FROM users WHERE id = $1`
	var u models.User
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, created_at, updated_at FROM users WHERE email = $1`
	var u models.User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Update(ctx context.Context, u *models.User) error {
	query := `UPDATE users SET name = $1, avatar_url = $2, locale = $3, updated_at = $4 WHERE id = $5`
	u.UpdatedAt = time.Now().UTC()
	_, err := r.db.ExecContext(ctx, query, u.Name, u.AvatarURL, u.Locale, u.UpdatedAt, u.ID)
	return err
}

func (r *UserRepo) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, passwordHash, time.Now().UTC(), id)
	return err
}

func (r *UserRepo) UpdateRole(ctx context.Context, id, role string) error {
	query := `UPDATE users SET role = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, role, time.Now().UTC(), id)
	return err
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
	query := `INSERT INTO user_social_accounts (id, user_id, provider, provider_user_id, email, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, provider) DO UPDATE SET provider_user_id = EXCLUDED.provider_user_id, email = EXCLUDED.email`
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

	query := fmt.Sprintf("SELECT id, email, password_hash, name, COALESCE(role, 'student'), avatar_url, locale, created_at, updated_at FROM users WHERE %s ORDER BY created_at DESC", whereSQL)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.AvatarURL, &u.Locale, &u.CreatedAt, &u.UpdatedAt); err != nil {
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
		INSERT INTO test_sessions (id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.ExecContext(ctx, query, s.ID, s.UserID, s.CandidateName, s.Status, s.CurrentStage, s.StageName, s.DifficultyLevel, s.CreatedAt)
	return err
}

func (r *SessionRepo) GetByID(ctx context.Context, id string) (*models.TestSession, error) {
	query := `
		SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level,
		       overall_score, literacy_score, comprehension_score, production_score, conversation_score,
		       created_at, completed_at
		FROM test_sessions WHERE id = $1
	`
	var s models.TestSession
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel,
		&s.OverallScore, &s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore,
		&s.CreatedAt, &s.CompletedAt,
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
		    overall_score = $5, literacy_score = $6, comprehension_score = $7,
		    production_score = $8, conversation_score = $9, completed_at = $10
		WHERE id = $11
	`
	_, err := r.db.ExecContext(ctx, query,
		s.Status, s.CurrentStage, s.StageName, s.DifficultyLevel,
		s.OverallScore, s.LiteracyScore, s.ComprehensionScore,
		s.ProductionScore, s.ConversationScore, s.CompletedAt, s.ID,
	)
	return err
}

func (r *SessionRepo) RecordResponse(ctx context.Context, resp *models.QuestionResponse) error {
	query := `
		INSERT INTO question_responses (id, session_id, question_id, user_response, is_correct, raw_score, time_spent_sec, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.ExecContext(ctx, query, resp.ID, resp.SessionID, resp.QuestionID, resp.UserResponse, resp.IsCorrect, resp.RawScore, resp.TimeSpentSec, resp.CreatedAt)
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
	query := `SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, overall_score, literacy_score, comprehension_score, production_score, conversation_score, created_at, completed_at FROM test_sessions WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.TestSession
	for rows.Next() {
		var s models.TestSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel, &s.OverallScore, &s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore, &s.CreatedAt, &s.CompletedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepo) ListRecent(ctx context.Context, limit int) ([]models.TestSession, error) {
	query := `SELECT id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, overall_score, literacy_score, comprehension_score, production_score, conversation_score, created_at, completed_at FROM test_sessions ORDER BY created_at DESC LIMIT $1`
	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.TestSession
	for rows.Next() {
		var s models.TestSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.CandidateName, &s.Status, &s.CurrentStage, &s.StageName, &s.DifficultyLevel, &s.OverallScore, &s.LiteracyScore, &s.ComprehensionScore, &s.ProductionScore, &s.ConversationScore, &s.CreatedAt, &s.CompletedAt); err != nil {
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

// --- Certificates ---

type CertRepo struct{ db *sql.DB }

func (r *CertRepo) Create(ctx context.Context, c *models.Certificate) error {
	query := `
		INSERT INTO certificates (id, user_id, test_session_id, candidate_name, overall_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.ExecContext(ctx, query, c.ID, c.UserID, c.TestSessionID, c.CandidateName, c.OverallScore, c.LiteracyScore, c.ComprehensionScore, c.ProductionScore, c.ConversationScore, c.IssuedAt, c.PDFURL)
	return err
}

func (r *CertRepo) GetByID(ctx context.Context, id string) (*models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE id = $1`
	var c models.Certificate
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL,
	)
	if err != nil {
		return nil, err
	}
	c.IsVerified = true
	return &c, nil
}

func (r *CertRepo) GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []models.Certificate
	for rows.Next() {
		var c models.Certificate
		if err := rows.Scan(&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL); err != nil {
			return nil, err
		}
		c.IsVerified = true
		certs = append(certs, c)
	}
	return certs, nil
}

func (r *CertRepo) GetBySessionID(ctx context.Context, sessionID string) (*models.Certificate, error) {
	query := `SELECT id, user_id, test_session_id, candidate_name, overall_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url FROM certificates WHERE test_session_id = $1`
	var c models.Certificate
	err := r.db.QueryRowContext(ctx, query, sessionID).Scan(
		&c.ID, &c.UserID, &c.TestSessionID, &c.CandidateName, &c.OverallScore, &c.LiteracyScore, &c.ComprehensionScore, &c.ProductionScore, &c.ConversationScore, &c.IssuedAt, &c.PDFURL,
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
