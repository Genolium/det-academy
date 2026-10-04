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

type TestSession struct {
	ID                 string     `json:"id"`
	UserID             string     `json:"userId"`
	CandidateName      string     `json:"candidateName"`
	Status             string     `json:"status"` // IN_PROGRESS, COMPLETED, ABANDONED
	CurrentStage       int        `json:"currentStage"`
	StageName          string     `json:"stageName"`
	DifficultyLevel    string     `json:"difficultyLevel"` // A2, B1, B2, C1
	OverallScore       *int       `json:"overallScore,omitempty"`
	LiteracyScore      *int       `json:"literacyScore,omitempty"`
	ComprehensionScore *int       `json:"comprehensionScore,omitempty"`
	ProductionScore    *int       `json:"productionScore,omitempty"`
	ConversationScore  *int       `json:"conversationScore,omitempty"`
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
	ReadSelectAccuracy        float64 `json:"readSelectAccuracy"`
	FillBlanksAccuracy        float64 `json:"fillBlanksAccuracy"`
	CTestAccuracy             float64 `json:"cTestAccuracy"`
	ListenTypeAccuracy        float64 `json:"listenTypeAccuracy"`
	InteractiveReadingScore   float64 `json:"interactiveReadingScore"`
	InteractiveListeningScore float64 `json:"interactiveListeningScore"`
	WritingScore              float64 `json:"writingScore"`
}

type CalculatedScores struct {
	Overall       int `json:"overall"`
	Literacy      int `json:"literacy"`
	Comprehension int `json:"comprehension"`
	Production    int `json:"production"`
	Conversation  int `json:"conversation"`
}

type SessionCompleteResponse struct {
	Session             TestSession      `json:"session"`
	Scores              CalculatedScores `json:"scores"`
	CertificateEligible bool             `json:"certificateEligible"`
	Certificate         *Certificate     `json:"certificate,omitempty"`
}

// Admin & CRM DTOs

type AdminStats struct {
	TotalUsers         int                `json:"totalUsers"`
	TotalSessions      int                `json:"totalSessions"`
	CompletedSessions  int                `json:"completedSessions"`
	AverageScore       float64            `json:"averageScore"`
	TotalCertificates  int                `json:"totalCertificates"`
	ActiveBanners      int                `json:"activeBanners"`
	TotalBannerClicks  int                `json:"totalBannerClicks"`
	TotalQuestions     int                `json:"totalQuestions"`
	TotalInstitutions  int                `json:"totalInstitutions"`
	ScoreDistribution  map[string]int     `json:"scoreDistribution"`
	RecentRegistrations []User            `json:"recentRegistrations"`
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
