package models

import (
	"encoding/json"
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Role         string    `json:"role"` // "student", "editor", "admin"
	AvatarURL    string    `json:"avatarUrl"`
	Locale       string    `json:"locale"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type TheoryProgress struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	LessonSlug  string    `json:"lessonSlug"`
	IsCompleted bool      `json:"isCompleted"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Question struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"`           // READ_SELECT, FILL_BLANKS, C_TEST, LISTEN_TYPE, etc.
	DifficultyBand string          `json:"difficultyBand"` // A2, B1, B2, C1, C2
	ContentPayload json.RawMessage `json:"contentPayload"`
	CorrectAnswers json.RawMessage `json:"correctAnswers,omitempty"` // Omitted in student test responses
	TimeLimitSec   int             `json:"timeLimitSec"`
	IsActive       bool            `json:"isActive"`
	CreatedAt      time.Time       `json:"createdAt"`
}

type BlueprintStage struct {
	StageName     string `json:"stageName"`
	DisplayName   string `json:"displayName"`
	SkillCategory string `json:"skillCategory"` // "reading", "listening", "writing", "speaking", "integrated"
	ItemCount     int    `json:"itemCount"`
	TimeLimitSec  int    `json:"timeLimitSec"`
	Description   string `json:"description"`
}

type ExamBlueprint struct {
	Version     string           `json:"version"`     // "2025.1"
	TotalStages int              `json:"totalStages"` // 13
	Stages      []BlueprintStage `json:"stages"`
}

// GetDefaultExamBlueprint returns the official modern DET 13-task structure
func GetDefaultExamBlueprint() ExamBlueprint {
	return ExamBlueprint{
		Version:     "2026.1",
		TotalStages: 13,
		Stages: []BlueprintStage{
			{
				StageName:     "READ_SELECT",
				DisplayName:   "Read and Select",
				SkillCategory: "reading",
				ItemCount:     15,
				TimeLimitSec:  75, // 5s per word
				Description:   "Select real English words from pseudo words",
			},
			{
				StageName:     "FILL_BLANKS",
				DisplayName:   "Fill in the Blanks",
				SkillCategory: "reading",
				ItemCount:     6,
				TimeLimitSec:  120, // 20s per item
				Description:   "Complete the missing word in context",
			},
			{
				StageName:     "C_TEST",
				DisplayName:   "Read and Complete",
				SkillCategory: "reading",
				ItemCount:     1,
				TimeLimitSec:  180, // 3 minutes
				Description:   "Complete missing letters in a passage",
			},
			{
				StageName:     "LISTEN_TYPE",
				DisplayName:   "Listen and Type",
				SkillCategory: "listening",
				ItemCount:     3,
				TimeLimitSec:  180, // 60s per item
				Description:   "Type the statement you hear",
			},
			{
				StageName:     "INTERACTIVE_READING",
				DisplayName:   "Interactive Reading",
				SkillCategory: "reading",
				ItemCount:     2,
				TimeLimitSec:  420, // 7 minutes
				Description:   "Multi-step comprehension of an academic text",
			},
			{
				StageName:     "INTERACTIVE_LISTENING",
				DisplayName:   "Interactive Listening",
				SkillCategory: "listening",
				ItemCount:     2,
				TimeLimitSec:  240, // 4 minutes
				Description:   "Conversational dialogue and passage summary",
			},
			{
				StageName:     "WRITE_PHOTO",
				DisplayName:   "Write About the Photo",
				SkillCategory: "writing",
				ItemCount:     3,
				TimeLimitSec:  180, // 60s per photo
				Description:   "Write one or more complete sentences describing an image",
			},
			{
				StageName:     "INTERACTIVE_WRITING",
				DisplayName:   "Interactive Writing",
				SkillCategory: "writing",
				ItemCount:     2,
				TimeLimitSec:  480, // 5 min prompt + 3 min follow-up
				Description:   "Two-part connected academic writing task",
			},
			{
				StageName:     "SPEAK_PHOTO",
				DisplayName:   "Speak About the Photo",
				SkillCategory: "speaking",
				ItemCount:     1,
				TimeLimitSec:  90,
				Description:   "Speak for 90 seconds describing an image in detail",
			},
			{
				StageName:     "READ_THEN_SPEAK",
				DisplayName:   "Read, Then Speak",
				SkillCategory: "speaking",
				ItemCount:     1,
				TimeLimitSec:  90,
				Description:   "Read a written prompt and speak on the topic for 90 seconds",
			},
			{
				StageName:     "INTERACTIVE_SPEAKING",
				DisplayName:   "Interactive Speaking",
				SkillCategory: "speaking",
				ItemCount:     6,
				TimeLimitSec:  210, // 6 turns x 35s
				Description:   "Sequential multi-turn conversational speaking",
			},
			{
				StageName:     "WRITING_SAMPLE",
				DisplayName:   "Writing Sample",
				SkillCategory: "writing",
				ItemCount:     1,
				TimeLimitSec:  300, // 5 minutes
				Description:   "Extended argument or discussion essay",
			},
			{
				StageName:     "SPEAKING_SAMPLE",
				DisplayName:   "Speaking Sample",
				SkillCategory: "speaking",
				ItemCount:     1,
				TimeLimitSec:  180, // 3 minutes
				Description:   "Extended spoken response on an open topic",
			},
		},
	}
}

type TestSession struct {
	ID                 string     `json:"id"`
	UserID             string     `json:"userId"`
	CandidateName      string     `json:"candidateName"`
	Status             string     `json:"status"` // IN_PROGRESS, COMPLETED, ABANDONED
	CurrentStage       int        `json:"currentStage"`
	StageName          string     `json:"stageName"`
	DifficultyLevel    string     `json:"difficultyLevel"` // A2, B1, B2, C1
	OverallScore       *int       `json:"overallScore,omitempty"`
	ReadingScore       *int       `json:"readingScore,omitempty"`
	ListeningScore     *int       `json:"listeningScore,omitempty"`
	WritingScore       *int       `json:"writingScore,omitempty"`
	SpeakingScore      *int       `json:"speakingScore,omitempty"`
	LiteracyScore      *int       `json:"literacyScore,omitempty"`
	ComprehensionScore *int       `json:"comprehensionScore,omitempty"`
	ProductionScore    *int       `json:"productionScore,omitempty"`
	ConversationScore  *int       `json:"conversationScore,omitempty"`
	DeadlineAt         *time.Time `json:"deadlineAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	CompletedAt        *time.Time `json:"completedAt,omitempty"`
}

type QuestionResponse struct {
	ID           string          `json:"id"`
	SessionID    string          `json:"sessionId"`
	QuestionID   string          `json:"questionId"`
	UserResponse json.RawMessage `json:"userResponse"`
	IsCorrect    *bool           `json:"isCorrect,omitempty"`
	RawScore     float64         `json:"rawScore"`
	TimeSpentSec int             `json:"timeSpentSec"`
	CreatedAt    time.Time       `json:"createdAt"`
}

type Certificate struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"userId"`
	TestSessionID      string    `json:"testSessionId"`
	CandidateName      string    `json:"candidateName"`
	OverallScore       int       `json:"overallScore"`
	ReadingScore       int       `json:"readingScore,omitempty"`
	ListeningScore     int       `json:"listeningScore,omitempty"`
	WritingScore       int       `json:"writingScore,omitempty"`
	SpeakingScore      int       `json:"speakingScore,omitempty"`
	LiteracyScore      int       `json:"literacyScore"`
	ComprehensionScore int       `json:"comprehensionScore"`
	ProductionScore    int       `json:"productionScore"`
	ConversationScore  int       `json:"conversationScore"`
	IssuedAt           time.Time `json:"issuedAt"`
	PDFURL             string    `json:"pdfUrl"`
	IsVerified         bool      `json:"isVerified"`
}

type AdBanner struct {
	ID          string    `json:"id"`
	Placement   string    `json:"placement"` // HEADER, FOOTER
	ImageURL    string    `json:"imageUrl"`
	TargetURL   string    `json:"targetUrl"`
	AltText     string    `json:"altText"`
	IsActive    bool      `json:"isActive"`
	Impressions int       `json:"impressions"`
	Clicks      int       `json:"clicks"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Institution represents a university or college accepting Duolingo English Test
type Institution struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Country        string    `json:"country"`
	City           string    `json:"city"`
	State          string    `json:"state,omitempty"`
	MinScore       int       `json:"minScore"` // e.g. 105, 115, 120, 125, 130
	SubscoreReqs   string    `json:"subscoreReqs,omitempty"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	WebsiteURL     string    `json:"websiteUrl"`
	LogoURL        string    `json:"logoUrl,omitempty"`
	Category       string    `json:"category"` // "Ivy League", "Top Global", "Public Ivy", "Canadian Top", "Russell Group", "STEM", "Europe"
	AcceptanceRate string    `json:"acceptanceRate,omitempty"`
	Programs       []string  `json:"programs"` // e.g. ["Undergraduate", "Graduate"]
	CreatedAt      time.Time `json:"createdAt"`
}

// Request and Response DTOs

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Locale   string `json:"locale,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type OAuthLoginRequest struct {
	Provider     string `json:"provider"`              // "google", "apple", "vk", "yandex"
	Code         string `json:"code"`                  // OAuth authorization code or token
	RedirectURI  string `json:"redirectUri,omitempty"` // redirect URI used in auth flow
	Email        string `json:"email,omitempty"`
	Name         string `json:"name,omitempty"`
	AvatarURL    string `json:"avatarUrl,omitempty"`
	DeviceID     string `json:"deviceId,omitempty"`     // VK ID device_id
	CodeVerifier string `json:"codeVerifier,omitempty"` // PKCE code_verifier
	Nonce        string `json:"nonce,omitempty"`        // OIDC nonce for Google/Apple
}

type UpdateProfileRequest struct {
	Name      string `json:"name,omitempty"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}

type OAuthURLResponse struct {
	Provider string `json:"provider"`
	URL      string `json:"url"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ToggleTheoryRequest struct {
	LessonSlug string `json:"lessonSlug"`
}

type TheoryProgressResponse struct {
	CompletedLessons []string `json:"completedLessons"`
	TotalLessons     int      `json:"totalLessons"`
	ProgressPercent  int      `json:"progressPercent"`
	IsAllCompleted   bool     `json:"isAllCompleted"`
}

type StartSessionRequest struct {
	CandidateName   string `json:"candidateName,omitempty"`
	DifficultyLevel string `json:"difficultyLevel,omitempty"` // Default B1
}

type SubmitResponseRequest struct {
	QuestionID   string          `json:"questionId"`
	UserResponse json.RawMessage `json:"userResponse"`
	RawScore     float64         `json:"rawScore"` // 0.0 - 1.0
	TimeSpentSec int             `json:"timeSpentSec"`
}

type StageCompleteRequest struct {
	StageName        string  `json:"stageName"`
	Accuracy         float64 `json:"accuracy"` // 0.0 - 1.0
	TotalQuestions   int     `json:"totalQuestions"`
	CorrectQuestions int     `json:"correctQuestions"`
}

type CompleteSessionRequest struct {
	ReadSelectAccuracy        float64 `json:"readSelectAccuracy,omitempty"`
	FillBlanksAccuracy        float64 `json:"fillBlanksAccuracy,omitempty"`
	CTestAccuracy             float64 `json:"cTestAccuracy,omitempty"`
	ListenTypeAccuracy        float64 `json:"listenTypeAccuracy,omitempty"`
	InteractiveReadingScore   float64 `json:"interactiveReadingScore,omitempty"`
	InteractiveListeningScore float64 `json:"interactiveListeningScore,omitempty"`
	WritingScore              float64 `json:"writingScore,omitempty"`
	SpeakingScore             float64 `json:"speakingScore,omitempty"`
}

type CalculatedScores struct {
	Overall       int `json:"overall"`
	Reading       int `json:"reading"`
	Listening     int `json:"listening"`
	Writing       int `json:"writing"`
	Speaking      int `json:"speaking"`
	Literacy      int `json:"literacy"`
	Comprehension int `json:"comprehension"`
	Production    int `json:"production"`
	Conversation  int `json:"conversation"`

	// Honesty metadata. A skill without recorded server-verified responses is
	// reported as not measured instead of borrowing a score from another skill.
	Completeness      float64  `json:"completeness"`
	Confidence        string   `json:"confidence"`
	RangeLow          int      `json:"rangeLow"`
	RangeHigh         int      `json:"rangeHigh"`
	NotMeasured       []string `json:"notMeasured,omitempty"`
	AnsweredQuestions int      `json:"answeredQuestions"`
	TimeoutEvents     int      `json:"timeoutEvents"`
}

type SessionDetailsResponse struct {
	Session   TestSession        `json:"session"`
	Questions []Question         `json:"questions"`
	Responses []QuestionResponse `json:"responses"`
	Blueprint ExamBlueprint      `json:"blueprint"`
}

type SessionCompleteResponse struct {
	Session             TestSession      `json:"session"`
	Scores              CalculatedScores `json:"scores"`
	CertificateEligible bool             `json:"certificateEligible"`
	Certificate         *Certificate     `json:"certificate,omitempty"`
}

type SessionEvent struct {
	ID         string          `json:"id"`
	SessionID  string          `json:"sessionId"`
	EventType  string          `json:"eventType"`
	StageName  string          `json:"stageName"`
	QuestionID string          `json:"questionId,omitempty"`
	Payload    json.RawMessage `json:"payload,omitempty"`
	CreatedAt  time.Time       `json:"createdAt"`
}

type VocabularyEntry struct {
	ID          string    `json:"id"`
	Word        string    `json:"word"`
	IPA         string    `json:"ipa,omitempty"`
	PartOfSpeech string   `json:"pos,omitempty"`
	Level       string    `json:"level"`
	MeaningRu   string    `json:"meaningRu"`
	DefinitionEn string   `json:"definitionEn"`
	Example     string    `json:"example,omitempty"`
	Collocations []string `json:"collocations,omitempty"`
	Source      string    `json:"source"`
	SourceURL   string    `json:"sourceUrl,omitempty"`
	Status      string    `json:"status"`
	Version     string    `json:"version"`
	ReviewedAt  time.Time `json:"reviewedAt"`
}

// Admin & CRM DTOs

type AdminStats struct {
	TotalUsers          int            `json:"totalUsers"`
	TotalSessions       int            `json:"totalSessions"`
	CompletedSessions   int            `json:"completedSessions"`
	AverageScore        float64        `json:"averageScore"`
	TotalCertificates   int            `json:"totalCertificates"`
	ActiveBanners       int            `json:"activeBanners"`
	TotalBannerClicks   int            `json:"totalBannerClicks"`
	TotalQuestions      int            `json:"totalQuestions"`
	TotalInstitutions   int            `json:"totalInstitutions"`
	ScoreDistribution   map[string]int `json:"scoreDistribution"`
	RecentRegistrations []User         `json:"recentRegistrations"`
}

type UpdateUserRoleRequest struct {
	Role string `json:"role"`
}

type CreateBannerRequest struct {
	Placement string `json:"placement"`
	ImageURL  string `json:"imageUrl"`
	TargetURL string `json:"targetUrl"`
	AltText   string `json:"altText"`
	IsActive  bool   `json:"isActive"`
}

type CreateQuestionRequest struct {
	Type           string          `json:"type"`
	DifficultyBand string          `json:"difficultyBand"`
	ContentPayload json.RawMessage `json:"contentPayload"`
	CorrectAnswers json.RawMessage `json:"correctAnswers"`
	TimeLimitSec   int             `json:"timeLimitSec"`
	IsActive       bool            `json:"isActive"`
}

type CreateInstitutionRequest struct {
	Name           string   `json:"name"`
	Country        string   `json:"country"`
	City           string   `json:"city"`
	State          string   `json:"state,omitempty"`
	MinScore       int      `json:"minScore"`
	SubscoreReqs   string   `json:"subscoreReqs,omitempty"`
	Latitude       float64  `json:"latitude"`
	Longitude      float64  `json:"longitude"`
	WebsiteURL     string   `json:"websiteUrl"`
	LogoURL        string   `json:"logoUrl,omitempty"`
	Category       string   `json:"category"`
	AcceptanceRate string   `json:"acceptanceRate,omitempty"`
	Programs       []string `json:"programs"`
}

// Social Accounts & Identity Linking DTOs

type SocialAccount struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	Provider       string    `json:"provider"` // "google", "vk", "yandex", "apple"
	ProviderUserID string    `json:"providerUserId"`
	Email          string    `json:"email"`
	CreatedAt      time.Time `json:"createdAt"`
}

type LinkedProvidersResponse struct {
	Providers   []SocialAccount `json:"providers"`
	HasPassword bool            `json:"hasPassword"`
	Email       string          `json:"email"`
}

type SetPasswordRequest struct {
	OldPassword string `json:"oldPassword,omitempty"`
	NewPassword string `json:"newPassword"`
}

type LinkProviderRequest struct {
	Provider       string `json:"provider"`
	Code           string `json:"code,omitempty"`
	Token          string `json:"token,omitempty"`
	Email          string `json:"email,omitempty"`
	ProviderUserID string `json:"providerUserId,omitempty"`
	DeviceID       string `json:"deviceId,omitempty"`
	CodeVerifier   string `json:"codeVerifier,omitempty"`
	RedirectURI    string `json:"redirectUri,omitempty"`
	Nonce          string `json:"nonce,omitempty"`
}

// Media Asset models

type MediaAsset struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	SessionID   string    `json:"sessionId,omitempty"`
	QuestionID  string    `json:"questionId,omitempty"`
	FileType    string    `json:"fileType"`
	FilePath    string    `json:"filePath"`
	URL         string    `json:"url"`
	FileSize    int64     `json:"fileSize"`
	DurationSec float64   `json:"durationSec"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Rubric & NLP Evaluation Models

type EvaluationResult struct {
	ID               string    `json:"id"`
	ResponseID       string    `json:"responseId,omitempty"`
	SessionID        string    `json:"sessionId"`
	QuestionID       string    `json:"questionId"`
	QuestionType     string    `json:"questionType"`
	Status           string    `json:"status"` // "COMPLETED", "EMPTY", "INSUFFICIENT", "FAILED"
	Score            float64   `json:"score"`  // 0.0 - 1.0 calibrated ratio
	WordCount        int       `json:"wordCount"`
	UniqueWords      int       `json:"uniqueWords"`
	LexicalDiversity float64   `json:"lexicalDiversity"` // TTR
	AcademicWords    []string  `json:"academicWords"`
	Connectors       []string  `json:"connectors"`
	RelevanceScore   float64   `json:"relevanceScore"`
	CEFRLevel        string    `json:"cefrLevel"` // "A1", "A2", "B1", "B2", "C1", "C2"
	SpeakingDuration float64   `json:"speakingDuration,omitempty"`
	WPM              float64   `json:"wpm,omitempty"`
	Recommendations  []string  `json:"recommendations"`
	AudioURL         string    `json:"audioUrl,omitempty"`
	Transcript       string    `json:"transcript,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
}

// Stage D: User Goals, Personalized Study Plan, SRS, and Error Notebook

type UserGoal struct {
	UserID             string    `json:"userId"`
	TargetScore        int       `json:"targetScore"`
	TargetDate         string    `json:"targetDate"` // YYYY-MM-DD
	DailyMinutes       int       `json:"dailyMinutes"`
	TargetUniversityID string    `json:"targetUniversityId,omitempty"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type UpdateGoalsRequest struct {
	TargetScore        int    `json:"targetScore"`
	TargetDate         string `json:"targetDate"` // YYYY-MM-DD
	DailyMinutes       int    `json:"dailyMinutes"`
	TargetUniversityID string `json:"targetUniversityId,omitempty"`
}

type DailyTask struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // "srs", "error_recall", "theory", "practice_drill", "mock_test"
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionURL   string `json:"actionUrl"`
	Count       int    `json:"count,omitempty"`
	Priority    string `json:"priority"` // "HIGH", "MEDIUM", "LOW"
	Completed   bool   `json:"completed"`
}

type StudyPlanResponse struct {
	TargetScore       int         `json:"targetScore"`
	TargetDate        string      `json:"targetDate"`
	DaysRemaining     int         `json:"daysRemaining"`
	DailyMinutes      int         `json:"dailyMinutes"`
	CurrentEstimate   int         `json:"currentEstimate"`
	WeakestSkill      string      `json:"weakestSkill"`
	WeeklyHoursNeeded float64     `json:"weeklyHoursNeeded"`
	ReadinessPercent  int         `json:"readinessPercent"`
	StatusMessage     string      `json:"statusMessage"`
	TasksToday        []DailyTask `json:"tasksToday"`
}

type UserErrorItem struct {
	ID                   string     `json:"id"`
	UserID               string     `json:"userId"`
	QuestionType         string     `json:"type"`
	Prompt               string     `json:"prompt"`
	UserAnswer           string     `json:"userAnswer"`
	CorrectAnswer        string     `json:"correctAnswer"`
	Explanation          string     `json:"explanation,omitempty"`
	ConsecutiveSuccesses int        `json:"consecutiveSuccesses"`
	AttemptsCount        int        `json:"attemptsCount"`
	Mastered             bool       `json:"mastered"`
	LastReviewedAt       *time.Time `json:"lastReviewedAt,omitempty"`
	CreatedAt            time.Time  `json:"createdAt"`
}

type SaveErrorRequest struct {
	QuestionType  string `json:"type"`
	Prompt        string `json:"prompt"`
	UserAnswer    string `json:"userAnswer"`
	CorrectAnswer string `json:"correctAnswer"`
	Explanation   string `json:"explanation,omitempty"`
}

type RecallErrorRequest struct {
	Answer string `json:"answer"`
}

type RecallErrorResponse struct {
	Success              bool   `json:"success"`
	ConsecutiveSuccesses int    `json:"consecutiveSuccesses"`
	Mastered             bool   `json:"mastered"`
	CorrectAnswer        string `json:"correctAnswer"`
	Explanation          string `json:"explanation,omitempty"`
	Message              string `json:"message"`
}

type SRSCardProgress struct {
	CardID         string    `json:"cardId"`
	IntervalDays   int       `json:"intervalDays"`
	Repetitions    int       `json:"repetitions"`
	EasinessFactor float64   `json:"easinessFactor"`
	DueDate        string    `json:"dueDate"` // YYYY-MM-DD
	LastReviewedAt time.Time `json:"lastReviewedAt"`
}

type UserStreak struct {
	StreakDays     int    `json:"streakDays"`
	LastActiveDate string `json:"lastActiveDate"`
}

type RecordActivityRequest struct {
	Source           string `json:"source"`
	UTCOffsetMinutes int    `json:"utcOffsetMinutes"`
}

type SRSStats struct {
	StreakDays      int    `json:"streakDays"`
	LastStudiedDate string `json:"lastStudiedDate"` // YYYY-MM-DD
	TotalReviewed   int    `json:"totalReviewed"`
}

type SRSStateResponse struct {
	Stats         SRSStats                   `json:"stats"`
	Cards         map[string]SRSCardProgress `json:"cards"`
	OverdueCount  int                        `json:"overdueCount"`
	DueTodayCount int                        `json:"dueTodayCount"`
	TotalLearned  int                        `json:"totalLearned"`
}

type ReviewSRSCardRequest struct {
	CardID  string `json:"cardId"`
	Quality int    `json:"quality"` // 1 (Forgot), 3 (Hard), 4 (Good), 5 (Easy)
}

type ReviewSRSCardResponse struct {
	CardID         string  `json:"cardId"`
	IntervalDays   int     `json:"intervalDays"`
	Repetitions    int     `json:"repetitions"`
	EasinessFactor float64 `json:"easinessFactor"`
	DueDate        string  `json:"dueDate"`
	StreakDays     int     `json:"streakDays"`
	TotalReviewed  int     `json:"totalReviewed"`
}

type ModalityScore struct {
	Score          int    `json:"score"`
	CEFR           string `json:"cefr"`
	QuestionsCount int    `json:"questionsCount"`
	Status         string `json:"status"` // "VERIFIED", "NO_DATA"
}

type IntegratedSubscores struct {
	Literacy      int `json:"literacy"`
	Comprehension int `json:"comprehension"`
	Production    int `json:"production"`
	Conversation  int `json:"conversation"`
}

type SkillAttemptHistory struct {
	SessionID  string              `json:"sessionId"`
	Date       string              `json:"date"`
	Overall    int                 `json:"overall"`
	Modalities map[string]int      `json:"modalities"` // reading, listening, writing, speaking
	Subscores  IntegratedSubscores `json:"subscores"`
}

type SkillAnalyticsResponse struct {
	HasData         bool                     `json:"hasData"`
	LatestOverall   int                      `json:"latestOverall"`
	BestOverall     int                      `json:"bestOverall"`
	Modalities      map[string]ModalityScore `json:"modalities"` // "reading", "listening", "writing", "speaking"
	Subscores       IntegratedSubscores      `json:"subscores"`
	WeakestSkill    string                   `json:"weakestSkill"`
	Recommendations []string                 `json:"recommendations"`
	History         []SkillAttemptHistory    `json:"history"`
}
