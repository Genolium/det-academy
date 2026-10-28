package repository

import (
	"context"
	"det-academy-backend/internal/models"
	"time"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	UpdatePassword(ctx context.Context, id, passwordHash string) error
	UpdateRole(ctx context.Context, id, role string) error
	IncrementTokenVersion(ctx context.Context, id string) error
	SetEmailVerification(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error
	MarkEmailVerified(ctx context.Context, tokenHash string) (*models.User, error)
	Delete(ctx context.Context, id string) error
	ListAll(ctx context.Context, page, limit int, search, role string) ([]models.User, int, error)

	// Social accounts / linked providers
	GetSocialAccounts(ctx context.Context, userID string) ([]models.SocialAccount, error)
	GetSocialAccountByProviderUID(ctx context.Context, provider, providerUID string) (*models.SocialAccount, error)
	LinkSocialAccount(ctx context.Context, sa *models.SocialAccount) error
	UnlinkSocialAccount(ctx context.Context, userID, provider string) error
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *models.RefreshToken) error
	GetActiveByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
	GetByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
	Revoke(ctx context.Context, tokenHash string) error
	RevokeAllForUser(ctx context.Context, userID string) error
}

type TheoryRepository interface {
	GetUserProgress(ctx context.Context, userID string) ([]string, error)
	ToggleProgress(ctx context.Context, userID, lessonSlug string) (bool, error)
	SetProgress(ctx context.Context, userID, lessonSlug string, completed bool) error
}

type QuestionRepository interface {
	ListByTypeAndDifficulty(ctx context.Context, qType, difficultyBand string) ([]models.Question, error)
	GetByID(ctx context.Context, id string) (*models.Question, error)
	ListAllActive(ctx context.Context) ([]models.Question, error)
	Create(ctx context.Context, q *models.Question) error
	Delete(ctx context.Context, id string) error
	// SetActive retracts (false) or restores (true) a question without
	// deleting the history of attempts that already used it.
	SetActive(ctx context.Context, id string, active bool) error
	Count(ctx context.Context) (int, error)
}

type TestSessionRepository interface {
	Create(ctx context.Context, session *models.TestSession) error
	GetByID(ctx context.Context, id string) (*models.TestSession, error)
	Update(ctx context.Context, session *models.TestSession) error
	RecordResponse(ctx context.Context, resp *models.QuestionResponse) error
	GetSessionResponses(ctx context.Context, sessionID string) ([]models.QuestionResponse, error)
	GetUserSessions(ctx context.Context, userID string) ([]models.TestSession, error)
	ListRecent(ctx context.Context, limit int) ([]models.TestSession, error)
	GetStats(ctx context.Context) (total int, completed int, avgScore float64, scoreDist map[string]int, err error)
	// CountUserSessionsSince counts full mock attempts created after the given time.
	CountUserSessionsSince(ctx context.Context, userID string, since time.Time) (int, error)
	WithSessionLock(ctx context.Context, sessionID string, fn func() error) error
	RecordEvent(ctx context.Context, event *models.SessionEvent) error
	GetSessionEvents(ctx context.Context, sessionID string) ([]models.SessionEvent, error)
	AssignQuestions(ctx context.Context, assignments []models.SessionQuestion) error
	GetAssignedQuestions(ctx context.Context, sessionID, stageName string) ([]models.SessionQuestion, error)
	GetAllAssignedQuestions(ctx context.Context, sessionID string) ([]models.SessionQuestion, error)
	GetAssignedQuestion(ctx context.Context, sessionID, questionID string) (*models.SessionQuestion, error)
	SaveEvaluation(ctx context.Context, eval *models.EvaluationResult) error
	GetSessionEvaluations(ctx context.Context, sessionID string) ([]models.EvaluationResult, error)
	UpdateEvaluation(ctx context.Context, eval *models.EvaluationResult) error
	CreateEvaluationJob(ctx context.Context, job *models.EvaluationJob) error
	ClaimEvaluationJob(ctx context.Context) (*models.EvaluationJob, error)
	CompleteEvaluationJob(ctx context.Context, jobID string) error
	FailEvaluationJob(ctx context.Context, jobID string, retryAt time.Time, lastError string) error
	ReapStaleEvaluationJobs(ctx context.Context) (int, error)
	EvaluationQueueStats(ctx context.Context) (*models.EvaluationQueueStats, error)
	CountPendingEvaluationJobs(ctx context.Context, sessionID string) (int, error)
	UpdateResponseScore(ctx context.Context, sessionID, questionID string, rawScore float64, isCorrect bool) error
	SaveMediaAsset(ctx context.Context, asset *models.MediaAsset) error
	GetMediaAssetByID(ctx context.Context, id string) (*models.MediaAsset, error)
	// DeleteMediaAssetsBySession removes the media rows of a session and
	// returns their file paths so the caller can delete the files.
	DeleteMediaAssetsBySession(ctx context.Context, sessionID string) ([]string, error)
}

type CertificateRepository interface {
	Create(ctx context.Context, cert *models.Certificate) error
	GetByID(ctx context.Context, id string) (*models.Certificate, error)
	GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error)
	GetBySessionID(ctx context.Context, sessionID string) (*models.Certificate, error)
	Count(ctx context.Context) (int, error)
}

type BannerRepository interface {
	GetActiveByPlacement(ctx context.Context, placement string) ([]models.AdBanner, error)
	ListAll(ctx context.Context) ([]models.AdBanner, error)
	Create(ctx context.Context, b *models.AdBanner) error
	Update(ctx context.Context, b *models.AdBanner) error
	Delete(ctx context.Context, id string) error
	RecordClick(ctx context.Context, id string) error
	RecordImpression(ctx context.Context, id string) error
	GetStats(ctx context.Context) (activeCount int, totalClicks int, err error)
}

type InstitutionRepository interface {
	List(ctx context.Context, search, country string, minScore int, category string) ([]models.Institution, error)
	GetByID(ctx context.Context, id string) (*models.Institution, error)
	Create(ctx context.Context, inst *models.Institution) error
	Update(ctx context.Context, inst *models.Institution) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int, error)
}

// LimitRepository stores the daily counters used to cap expensive actions per
// client IP and per client device in addition to the per-user limits that are
// derived from the activity tables.
type LimitRepository interface {
	// ConsumeDaily atomically increments the counter for (scope, subject,
	// windowStart) and reports whether the request is within the limit. When
	// the counter already reached limit it is not incremented and used is the
	// stored value. A limit <= 0 means unlimited.
	ConsumeDaily(ctx context.Context, scope, subject string, windowStart time.Time, limit int) (used int, allowed bool, err error)
	// PurgeDailyBefore removes counters whose window started before the given
	// day. It is called opportunistically so the table does not grow forever.
	PurgeDailyBefore(ctx context.Context, before time.Time) error
	// ConsumeWindow is the short-window sibling of ConsumeDaily, used by the
	// HTTP rate limiter. The window is truncated by the caller.
	ConsumeWindow(ctx context.Context, bucket, subject string, windowStart time.Time, limit int) (used int, allowed bool, err error)
}

type OAuthTransactionRepository interface {
	Create(ctx context.Context, transaction *models.OAuthTransaction) error
	Consume(ctx context.Context, stateHash, provider string) (*models.OAuthTransaction, error)
	CleanupExpired(ctx context.Context) error
}

type StudyRepository interface {
	// Goals
	GetGoals(ctx context.Context, userID string) (*models.UserGoal, error)
	UpsertGoals(ctx context.Context, goal *models.UserGoal) error

	// Error Notebook
	GetErrors(ctx context.Context, userID string) ([]models.UserErrorItem, error)
	GetErrorByID(ctx context.Context, userID, errorID string) (*models.UserErrorItem, error)
	SaveError(ctx context.Context, item *models.UserErrorItem) error
	DeleteError(ctx context.Context, userID, errorID string) error

	// Daily activity / streak
	RecordActivity(ctx context.Context, userID, activityDate, source string) error
	GetActivityDates(ctx context.Context, userID string, limit int) ([]string, error)
	// AwardXP inserts a reward once per (user, idempotency key). It reports
	// whether the event was new, so callers can distinguish a retry.
	AwardXP(ctx context.Context, event *models.XPEvent) (bool, error)
	XPTotal(ctx context.Context, userID string) (int, error)
	XPBetween(ctx context.Context, userID string, from, to time.Time) (int, error)
	XPHistory(ctx context.Context, userID string, limit int) ([]models.XPEvent, error)
	CompletePlanTask(ctx context.Context, userID, taskID, taskDate, source string) error
	GetPlanTaskCompletions(ctx context.Context, userID, taskDate string) (map[string]time.Time, error)

	// Spaced Repetition (SRS)
	GetSRSStats(ctx context.Context, userID string) (*models.SRSStats, error)
	SaveSRSStats(ctx context.Context, userID string, stats *models.SRSStats) error
	GetSRSCards(ctx context.Context, userID string) (map[string]models.SRSCardProgress, error)
	SaveSRSCard(ctx context.Context, userID string, card *models.SRSCardProgress) error

	// Learning Events & Practice History
	RecordLearningEvent(ctx context.Context, event *models.LearningEvent) (bool, error)
	ListLearningEvents(ctx context.Context, userID string, limit int) ([]models.LearningEvent, error)
	CreatePracticeAssignment(ctx context.Context, assignment *models.PracticeAssignment) error
	GetPracticeAssignment(ctx context.Context, assignmentID string) (*models.PracticeAssignment, error)
	RecordPracticeAttempt(ctx context.Context, attempt *models.PracticeAttempt) error
	GetPracticeAttempts(ctx context.Context, userID, questionType string, limit int) ([]models.PracticeAttempt, error)
	// CountPracticeAttemptsSince counts practice answers of the given types
	// (all types when the list is empty) created after the given time.
	CountPracticeAttemptsSince(ctx context.Context, userID string, since time.Time, questionTypes []string) (int, error)
	// AI usage accounting (global, not per user).
	RecordAIUsage(ctx context.Context, event *models.AIUsageEvent) error
	AIUsageSummary(ctx context.Context, since time.Time) ([]models.AIUsageRow, error)
	RecordTypingAttempt(ctx context.Context, attempt *models.TypingAttempt) error
	GetTypingAttempts(ctx context.Context, userID string, limit int) ([]models.TypingAttempt, error)
	GetBestTypingWPM(ctx context.Context, userID string) (int, error)
	UpdateSkillMastery(ctx context.Context, userID, skill string, score float64) error
	GetSkillMastery(ctx context.Context, userID string) (map[string]models.UserSkillMastery, error)
}

type VocabularyRepository interface {
	List(ctx context.Context, search, level, source string, limit, offset int) ([]models.VocabularyEntry, error)
	ListAll(ctx context.Context) ([]models.VocabularyEntry, error)
	CountFiltered(ctx context.Context, search, level, source string) (int, error)
	UpdateStatus(ctx context.Context, id, status string) error
}

// AnalyticsRepository exposes read-only aggregates for the admin dashboard.
// It is intentionally separate from the student-facing repositories: every
// method returns counts only and never row-level personal data.
type AnalyticsRepository interface {
	AnalyticsOverview(ctx context.Context, from, to, now time.Time) (*models.AnalyticsOverview, error)
	AnalyticsTimeseries(ctx context.Context, metric string, from, to time.Time, bucket string) ([]models.AnalyticsPoint, error)
	AnalyticsFeatures(ctx context.Context, from, to time.Time, limit int) ([]models.AnalyticsFeature, error)
	AnalyticsRetention(ctx context.Context, from, to, now time.Time) ([]models.RetentionCohort, error)
}

type Storage interface {
	Users() UserRepository
	Theory() TheoryRepository
	Questions() QuestionRepository
	Sessions() TestSessionRepository
	Certificates() CertificateRepository
	Banners() BannerRepository
	Institutions() InstitutionRepository
	Study() StudyRepository
	Vocabulary() VocabularyRepository
	OAuthTransactions() OAuthTransactionRepository
	RefreshTokens() RefreshTokenRepository
	Limits() LimitRepository
	Analytics() AnalyticsRepository
	Ping(ctx context.Context) error
	Close() error
}
