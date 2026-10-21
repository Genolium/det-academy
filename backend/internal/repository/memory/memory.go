package memory

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	_ "embed"
	"encoding/json"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type MemoryStorage struct {
	mu                sync.RWMutex
	users             map[string]*models.User
	usersByEmail      map[string]*models.User
	theory            map[string]map[string]bool // userID -> lessonSlug -> isCompleted
	questions         map[string]*models.Question
	sessions          map[string]*models.TestSession
	responses         map[string][]models.QuestionResponse
	evaluations       map[string][]models.EvaluationResult // sessionID -> []EvaluationResult
	mediaAssets       map[string]*models.MediaAsset        // assetID -> *MediaAsset
	certificates      map[string]*models.Certificate
	banners           map[string]*models.AdBanner
	institutions      map[string]*models.Institution
	socialAccounts    map[string][]models.SocialAccount             // userID -> []SocialAccount
	goals             map[string]*models.UserGoal                   // userID -> *UserGoal
	errors            map[string]map[string]*models.UserErrorItem   // userID -> errorID -> *UserErrorItem
	srsStats          map[string]*models.SRSStats                   // userID -> *SRSStats
	srsCards          map[string]map[string]*models.SRSCardProgress // userID -> cardID -> *SRSCardProgress
	activity          map[string]map[string]bool                    // userID -> date -> active
	events            map[string][]models.SessionEvent              // sessionID -> events
	sessionQuestions  map[string][]models.SessionQuestion           // sessionID -> assignments
	vocabulary        map[string]models.VocabularyEntry             // entryID -> entry
	oauthTransactions map[string]models.OAuthTransaction            // stateHash -> transaction
	sessionLockMu     sync.Mutex
	sessionLocks      map[string]*sync.Mutex
}

func New() *MemoryStorage {
	s := &MemoryStorage{
		users:             make(map[string]*models.User),
		usersByEmail:      make(map[string]*models.User),
		theory:            make(map[string]map[string]bool),
		questions:         make(map[string]*models.Question),
		sessions:          make(map[string]*models.TestSession),
		responses:         make(map[string][]models.QuestionResponse),
		evaluations:       make(map[string][]models.EvaluationResult),
		mediaAssets:       make(map[string]*models.MediaAsset),
		certificates:      make(map[string]*models.Certificate),
		banners:           make(map[string]*models.AdBanner),
		institutions:      make(map[string]*models.Institution),
		socialAccounts:    make(map[string][]models.SocialAccount),
		goals:             make(map[string]*models.UserGoal),
		errors:            make(map[string]map[string]*models.UserErrorItem),
		srsStats:          make(map[string]*models.SRSStats),
		srsCards:          make(map[string]map[string]*models.SRSCardProgress),
		activity:          make(map[string]map[string]bool),
		events:            make(map[string][]models.SessionEvent),
		sessionQuestions:  make(map[string][]models.SessionQuestion),
		vocabulary:        make(map[string]models.VocabularyEntry),
		oauthTransactions: make(map[string]models.OAuthTransaction),
		sessionLocks:      make(map[string]*sync.Mutex),
	}
	s.seedDefaultData()
	s.seedVocabulary()
	return s
}

func (s *MemoryStorage) Users() repository.UserRepository               { return &userMemoryRepo{s: s} }
func (s *MemoryStorage) Theory() repository.TheoryRepository            { return &theoryMemoryRepo{s: s} }
func (s *MemoryStorage) Questions() repository.QuestionRepository       { return &questionMemoryRepo{s: s} }
func (s *MemoryStorage) Sessions() repository.TestSessionRepository     { return &sessionMemoryRepo{s: s} }
func (s *MemoryStorage) Certificates() repository.CertificateRepository { return &certMemoryRepo{s: s} }
func (s *MemoryStorage) Banners() repository.BannerRepository           { return &bannerMemoryRepo{s: s} }
func (s *MemoryStorage) Institutions() repository.InstitutionRepository {
	return &institutionMemoryRepo{s: s}
}
func (s *MemoryStorage) Study() repository.StudyRepository { return &studyMemoryRepo{s: s} }
func (s *MemoryStorage) Vocabulary() repository.VocabularyRepository {
	return &vocabularyMemoryRepo{s: s}
}
func (s *MemoryStorage) OAuthTransactions() repository.OAuthTransactionRepository {
	return &oauthTransactionMemoryRepo{s: s}
}
func (s *MemoryStorage) Ping(ctx context.Context) error { return nil }
func (s *MemoryStorage) Close() error                   { return nil }

//go:embed vocabulary_seed.json
var vocabularySeedJSON []byte

type seedVocabularyEntry struct {
	ID           string   `json:"id"`
	Word         string   `json:"word"`
	IPA          string   `json:"ipa"`
	Pos          string   `json:"pos"`
	Level        string   `json:"level"`
	MeaningRu    string   `json:"meaningRu"`
	DefinitionEn string   `json:"definitionEn"`
	Example      string   `json:"example"`
	Collocations []string `json:"collocations"`
}

func (s *MemoryStorage) seedVocabulary() {
	var raw []seedVocabularyEntry
	if err := json.Unmarshal(vocabularySeedJSON, &raw); err != nil {
		return
	}
	now := time.Now().UTC()
	for _, item := range raw {
		s.vocabulary[item.ID] = models.VocabularyEntry{
			ID:           item.ID,
			Word:         item.Word,
			IPA:          item.IPA,
			PartOfSpeech: item.Pos,
			Level:        item.Level,
			MeaningRu:    item.MeaningRu,
			DefinitionEn: item.DefinitionEn,
			Example:      item.Example,
			Collocations: item.Collocations,
			Source:       "Academic Word List (platform dataset)",
			SourceURL:    "https://www.wgtn.ac.nz/lals/resources/academicwordlist",
			Status:       "published",
			Version:      "2026.1",
			ReviewedAt:   now,
		}
	}
}

func (s *MemoryStorage) seedDefaultData() {
	now := time.Now()
	pwdHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	adminPwdHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	// Admin account: admin@det-academy.com / admin123
	admin := &models.User{
		ID:           "00000000-0000-0000-0000-000000000000",
		Email:        "admin@det-academy.com",
		PasswordHash: string(adminPwdHash),
		Name:         "Super Administrator",
		Role:         "admin",
		AvatarURL:    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
		Locale:       "ru",
		CreatedAt:    now.Add(-30 * 24 * time.Hour),
		UpdatedAt:    now,
	}
	s.users[admin.ID] = admin
	s.usersByEmail[admin.Email] = admin

	alex := &models.User{
		ID:           "00000000-0000-0000-0000-000000000001",
		Email:        "alex@det-academy.com",
		PasswordHash: string(pwdHash),
		Name:         "Alex Rivera",
		Role:         "admin",
		AvatarURL:    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
		Locale:       "en",
		CreatedAt:    now.Add(-10 * 24 * time.Hour),
		UpdatedAt:    now,
	}
	s.users[alex.ID] = alex
	s.usersByEmail[alex.Email] = alex

	student := &models.User{
		ID:           "00000000-0000-0000-0000-000000000002",
		Email:        "student@det-academy.com",
		PasswordHash: string(pwdHash),
		Name:         "Demo Student",
		Role:         "student",
		AvatarURL:    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
		Locale:       "ru",
		CreatedAt:    now.Add(-5 * 24 * time.Hour),
		UpdatedAt:    now,
	}
	s.users[student.ID] = student
	s.usersByEmail[student.Email] = student

	// Seed 12 completed lessons for Alex
	alexLessons := map[string]bool{
		"rules-and-technicalities": true,
		"read-and-select":          true,
		"fill-in-the-blanks":       true,
		"read-and-complete":        true,
		"listen-and-type":          true,
		"interactive-reading":      true,
		"interactive-listening":    true,
		"write-about-the-photo":    true,
		"speak-about-the-photo":    true,
		"interactive-writing":      true,
		"read-listen-speak":        true,
		"interactive-speaking":     true,
	}
	s.theory[alex.ID] = alexLessons

	// Seed completed lessons for Demo Student (5 of 12)
	studentLessons := map[string]bool{
		"rules-and-technicalities": true,
		"read-and-select":          true,
		"fill-in-the-blanks":       true,
		"read-and-complete":        true,
		"listen-and-type":          true,
	}
	s.theory[student.ID] = studentLessons

	// Seed Ad Banners
	b1 := &models.AdBanner{
		ID:          "10000000-0000-0000-0000-000000000001",
		Placement:   "HEADER",
		ImageURL:    "",
		TargetURL:   "https://so-called-spark.ru",
		AltText:     "Выиграй грант $20,000 на учёбу в США — «так называемый SPARK». Промокод DET_ACADEMY",
		IsActive:    true,
		Impressions: 450,
		Clicks:      18,
		CreatedAt:   now,
	}
	b2 := &models.AdBanner{
		ID:          "10000000-0000-0000-0000-000000000002",
		Placement:   "FOOTER",
		ImageURL:    "",
		TargetURL:   "https://so-called-spark.ru",
		AltText:     "#так_называемый_SPARK · Набор открыт, старт заявочной кампании — октябрь 2026. Промокод DET_ACADEMY",
		IsActive:    true,
		Impressions: 390,
		Clicks:      25,
		CreatedAt:   now,
	}
	s.banners[b1.ID] = b1
	s.banners[b2.ID] = b2

	// Seed Demo Completed Test Session for Alex
	alexScore := 125
	alexLit := 120
	alexComp := 130
	alexProd := 125
	alexConv := 125
	alexCompleted := now.Add(-24 * time.Hour)
	sess := &models.TestSession{
		ID:                 "20000000-0000-0000-0000-000000000001",
		UserID:             alex.ID,
		CandidateName:      alex.Name,
		Status:             "COMPLETED",
		CurrentStage:       10,
		StageName:          "COMPLETED",
		DifficultyLevel:    "C1",
		OverallScore:       &alexScore,
		LiteracyScore:      &alexLit,
		ComprehensionScore: &alexComp,
		ProductionScore:    &alexProd,
		ConversationScore:  &alexConv,
		CreatedAt:          now.Add(-25 * time.Hour),
		CompletedAt:        &alexCompleted,
	}
	s.sessions[sess.ID] = sess

	// Seed Certificate
	cert := &models.Certificate{
		ID:                 "det-cert-8f921a4",
		UserID:             alex.ID,
		TestSessionID:      sess.ID,
		CandidateName:      alex.Name,
		OverallScore:       125,
		LiteracyScore:      120,
		ComprehensionScore: 130,
		ProductionScore:    125,
		ConversationScore:  125,
		IssuedAt:           now.Add(-24 * time.Hour),
		PDFURL:             "/certificates/det-cert-8f921a4.pdf",
		IsVerified:         true,
	}
	s.certificates[cert.ID] = cert

	// Seed Questions
	s.seedQuestions()

	// Seed Institutions (universities accepting DET)
	s.seedInstitutions()
}

func (s *MemoryStorage) seedQuestions() {
	questions := []models.Question{
		{
			ID:             "q-rs-01",
			Type:           "READ_SELECT",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"word":"ambiguous"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":true}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-02",
			Type:           "READ_SELECT",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"word":"disflown"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":false}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-03",
			Type:           "READ_SELECT",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"word":"empirical"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":true}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-04",
			Type:           "READ_SELECT",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"word":"refulgent"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":true}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-fb-01",
			Type:           "FILL_BLANKS",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"sentence":"The research team made a breakthrough in renewable en____ yesterday.","prefix":"en","length":4}`),
			CorrectAnswers: json.RawMessage(`{"answer":"ergy"}`),
			TimeLimitSec:   20,
			IsActive:       true,
		},
		{
			ID:             "q-fb-02",
			Type:           "FILL_BLANKS",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"sentence":"Students must sub___ their thesis proposals by Friday.","prefix":"sub","length":3}`),
			CorrectAnswers: json.RawMessage(`{"answer":"mit"}`),
			TimeLimitSec:   20,
			IsActive:       true,
		},
		{
			ID:             "q-lt-01",
			Type:           "LISTEN_TYPE",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"audioUrl":"","spokenText":"The library provides free access to academic journals."}`),
			CorrectAnswers: json.RawMessage(`{"text":"The library provides free access to academic journals."}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-ct-01",
			Type:           "C_TEST",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"text":"Urban architecture is rapidly transforming modern cities worldwide. Architects now inc________ sustainable materials to mi________ environmental damage. Green spaces are cr______ within high-density districts. This innovative approach fosters community resilience and improves public well-being."}`),
			CorrectAnswers: json.RawMessage(`{"answers":["orporate","nimize","eated"]}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
		{
			ID:             "q-ir-01",
			Type:           "INTERACTIVE_READING",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"passageTitle":"Marine Ecosystems","passageText":"Coral reefs represent some of the most biodiverse ecosystems on our planet. They provide vital coastal protection against severe storms and support thousands of marine species. Recent rises in ocean temperatures have accelerated coral bleaching worldwide. Conservationists are deploying artificial reefs to facilitate habitat regeneration.","gapSentence":{"before":"Coral reefs provide vital coastal ","options":["protection","destruction","pollution","navigation"],"correct":"protection","after":" against severe tropical storms."}}`),
			CorrectAnswers: json.RawMessage(`{"gapCorrect":"protection","highlightCorrect":"provide vital coastal protection"}`),
			TimeLimitSec:   420,
			IsActive:       true,
		},
		{
			ID:             "q-ir-02",
			Type:           "INTERACTIVE_READING",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"passageTitle":"Renewable Energy Storage","passageText":"As renewable generation expands, grid-scale energy storage becomes essential. Lithium-ion batteries currently dominate short-duration balancing, while pumped hydroelectric systems handle long-term demands. Emerging technologies like flow batteries and compressed air offer scalable alternatives for multi-day storage needs.","gapSentence":{"before":"Grid-scale storage becomes essential to balance ","options":["intermittent","permanent","negligible","identical"],"correct":"intermittent","after":" renewable energy production."}}`),
			CorrectAnswers: json.RawMessage(`{"gapCorrect":"intermittent","highlightCorrect":"grid-scale energy storage becomes essential"}`),
			TimeLimitSec:   420,
			IsActive:       true,
		},
		{
			ID:             "q-il-01",
			Type:           "INTERACTIVE_LISTENING",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"scenario":"You are talking to your academic advisor about your course schedule.","turns":[{"speaker":"Advisor","speakerAudioText":"Good morning! How are your preparation plans coming along for next semester?","options":["I would like to discuss enrolling in advanced statistics and economics.","I forgot where the library is located.","I am looking for the cafeteria."],"correctIndex":0}],"summaryPrompt":"Write a 75-word summary of your conversation with your academic advisor."}`),
			CorrectAnswers: json.RawMessage(`{"turnsAnswers":[0],"summaryRubric":"advisor_course_schedule"}`),
			TimeLimitSec:   240,
			IsActive:       true,
		},
		{
			ID:             "q-il-02",
			Type:           "INTERACTIVE_LISTENING",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"scenario":"You are speaking with your biology lab instructor regarding a project deadline.","turns":[{"speaker":"Instructor","speakerAudioText":"Hello! Did your group complete the water quality sampling protocol?","options":["Yes, we gathered all field samples and are ready to run the spectrometry analysis.","No, we decided to cancel the entire semester.","We have not attended any classes."],"correctIndex":0}],"summaryPrompt":"Summarize the key decisions agreed upon during the lab briefing."}`),
			CorrectAnswers: json.RawMessage(`{"turnsAnswers":[0],"summaryRubric":"lab_water_sampling"}`),
			TimeLimitSec:   240,
			IsActive:       true,
		},
		{
			ID:             "q-wp-01",
			Type:           "WRITE_PHOTO",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/student-library.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"grammar_vocabulary_structure"}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-wp-02",
			Type:           "WRITE_PHOTO",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/laboratory-science.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"grammar_vocabulary_structure"}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-iw-01",
			Type:           "INTERACTIVE_WRITING",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"part1Prompt":"Describe an important hobby or interest that you pursue in your free time. Explain why it is valuable to you. Write for 5 minutes (minimum 80 words).","part2Prompt":"How does engaging in hobbies help people maintain balance during demanding academic or professional periods? Write for 3 minutes (minimum 50 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_cohesion_min80_min50"}`),
			TimeLimitSec:   480,
			IsActive:       true,
		},
		{
			ID:             "q-iw-02",
			Type:           "INTERACTIVE_WRITING",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"part1Prompt":"Some universities require students to complete community service hours prior to graduation. Do you support this policy? Explain your reasons with examples. Write for 5 minutes (minimum 80 words).","part2Prompt":"What unintended challenges might students encounter when community service is made mandatory rather than voluntary? Write for 3 minutes (minimum 50 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_cohesion_min80_min50"}`),
			TimeLimitSec:   480,
			IsActive:       true,
		},
		{
			ID:             "q-sp-01",
			Type:           "SPEAK_PHOTO",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/park-gathering.jpg","prompt":"Speak for 90 seconds about the scene in this image. Describe what the people are doing and the environment around them."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_pronunciation_vocabulary_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-sp-02",
			Type:           "SPEAK_PHOTO",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/engineering-workshop.jpg","prompt":"Speak for 90 seconds about what you see in the photo. Describe the equipment, the people involved, and what they appear to be building."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_pronunciation_vocabulary_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-rts-01",
			Type:           "READ_THEN_SPEAK",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"prompt":"Describe a memorable journey or trip you have taken. Where did you travel, who accompanied you, and what made this experience unforgettable? Speak for 90 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_organization_academic_discourse_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-rts-02",
			Type:           "READ_THEN_SPEAK",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"prompt":"Discuss a technological advancement that has significantly affected human communication over the past decade. Explain how it has altered relationships and what drawbacks have arisen. Speak for 90 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_organization_academic_discourse_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-is-01",
			Type:           "INTERACTIVE_SPEAKING",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"scenario":"You are speaking with your academic advisor about your study schedule.","prompt":"Explain why you want to change one of your elective courses for next term. Speak clearly for 35 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"conversational_fluency_responsiveness"}`),
			TimeLimitSec:   210,
			IsActive:       true,
		},
		{
			ID:             "q-is-02",
			Type:           "INTERACTIVE_SPEAKING",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"scenario":"You are participating in an academic seminar discussing public health initiatives.","prompt":"Address the question: how can local governments incentivize healthy eating habits among urban populations? Speak for 35 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"conversational_fluency_responsiveness"}`),
			TimeLimitSec:   210,
			IsActive:       true,
		},
		{
			ID:             "q-ws-01",
			Type:           "WRITING_SAMPLE",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"prompt":"Many people argue that students benefit more from studying practical career skills than theoretical academic subjects. Which do you consider more beneficial for long-term success? Write for 5 minutes (minimum 100 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_argumentation_min100"}`),
			TimeLimitSec:   300,
			IsActive:       true,
		},
		{
			ID:             "q-ws-02",
			Type:           "WRITING_SAMPLE",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"prompt":"Do you believe governments should prioritize public funding for space exploration or for resolving pressing environmental issues on Earth? State your position and defend it with reasons and evidence. Write for 5 minutes (minimum 100 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_argumentation_min100"}`),
			TimeLimitSec:   300,
			IsActive:       true,
		},
		{
			ID:             "q-ss-01",
			Type:           "SPEAKING_SAMPLE",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"prompt":"Some people prefer living in large cosmopolitan cities, while others find life in smaller rural towns more satisfying. Which lifestyle do you personally prefer, and why? Speak for 1 to 3 minutes."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"extended_discourse_academic_speech_min180s"}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
		{
			ID:             "q-ss-02",
			Type:           "SPEAKING_SAMPLE",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"prompt":"With the rapid development of artificial intelligence, should schools mandate AI literacy courses for all students, or should AI tools be restricted in academic evaluations? Defend your opinion for 1 to 3 minutes."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"extended_discourse_academic_speech_min180s"}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
		{
			ID:             "q-rs-05",
			Type:           "READ_SELECT",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"word":"substantiate"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":true}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-06",
			Type:           "READ_SELECT",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"word":"incomplience"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":false}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-07",
			Type:           "READ_SELECT",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"word":"ephemeral"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":true}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-rs-08",
			Type:           "READ_SELECT",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"word":"transpeciate"}`),
			CorrectAnswers: json.RawMessage(`{"isReal":false}`),
			TimeLimitSec:   5,
			IsActive:       true,
		},
		{
			ID:             "q-fb-03",
			Type:           "FILL_BLANKS",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"sentence":"The professor asked the students to cl___fy their thesis argument.","prefix":"cl","length":3}`),
			CorrectAnswers: json.RawMessage(`{"answer":"arify"}`),
			TimeLimitSec:   20,
			IsActive:       true,
		},
		{
			ID:             "q-fb-04",
			Type:           "FILL_BLANKS",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"sentence":"The committee reached a unan_____ decision after lengthy debates.","prefix":"unan","length":5}`),
			CorrectAnswers: json.RawMessage(`{"answer":"imous"}`),
			TimeLimitSec:   20,
			IsActive:       true,
		},
		{
			ID:             "q-lt-02",
			Type:           "LISTEN_TYPE",
			DifficultyBand: "B2",
			ContentPayload: json.RawMessage(`{"audioUrl":"","spokenText":"Technological innovations are reshaping global transportation networks."}`),
			CorrectAnswers: json.RawMessage(`{"text":"Technological innovations are reshaping global transportation networks."}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-lt-03",
			Type:           "LISTEN_TYPE",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"audioUrl":"","spokenText":"The economic consequences of inflation require comprehensive fiscal intervention."}`),
			CorrectAnswers: json.RawMessage(`{"text":"The economic consequences of inflation require comprehensive fiscal intervention."}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-ct-02",
			Type:           "C_TEST",
			DifficultyBand: "B1",
			ContentPayload: json.RawMessage(`{"text":"Environmental conservation is essential for preserving global biodiversity. Forest ec________ provide critical habitats for en________ species. Without rigorous prot______, numerous species could face extinction in coming decades."}`),
			CorrectAnswers: json.RawMessage(`{"answers":["osystems","dangered","ection"]}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
		{
			ID:             "q-ct-03",
			Type:           "C_TEST",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"text":"Cognitive psychology investigates the underlying mechanisms of human memory retention. Researchers hypothesize that sleep facilitates mem________ consolidation, allowing the brain to str________ synaptic connections. Further empirical st________ are warranted to substantiate this model."}`),
			CorrectAnswers: json.RawMessage(`{"answers":["ory","engthen","udies"]}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
		{
			ID:             "q-ir-03",
			Type:           "INTERACTIVE_READING",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"passageTitle":"Quantum Computing Horizons","passageText":"Quantum computing harnesses superposition and entanglement to solve computational problems intractable for classical hardware. While cryptographic implications raise pressing security concerns, quantum algorithms promise unprecedented acceleration in molecular simulation and materials design.","gapSentence":{"before":"Quantum algorithms offer unprecedented acceleration in ","options":["materials","destructive","negligible","obsolete"],"correct":"materials","after":" design and pharmaceutical modeling."}}`),
			CorrectAnswers: json.RawMessage(`{"gapCorrect":"materials","highlightCorrect":"cryptographic implications raise pressing security concerns"}`),
			TimeLimitSec:   420,
			IsActive:       true,
		},
		{
			ID:             "q-il-03",
			Type:           "INTERACTIVE_LISTENING",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"scenario":"You are speaking with a university admissions officer regarding international scholarship requirements.","turns":[{"speaker":"Officer","speakerAudioText":"Welcome to the office. Are you applying for the merit-based global leadership stipend?","options":["Yes, I would like to confirm the submission criteria and minimum Duolingo score required.","No, I want to withdraw my application immediately.","Where can I buy lunch on campus?"],"correctIndex":0}],"summaryPrompt":"Summarize the required application credentials discussed in your consultation."}`),
			CorrectAnswers: json.RawMessage(`{"turnsAnswers":[0],"summaryRubric":"admissions_scholarship_criteria"}`),
			TimeLimitSec:   240,
			IsActive:       true,
		},
		{
			ID:             "q-wp-03",
			Type:           "WRITE_PHOTO",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/university-lecture.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"grammar_vocabulary_structure"}`),
			TimeLimitSec:   60,
			IsActive:       true,
		},
		{
			ID:             "q-iw-03",
			Type:           "INTERACTIVE_WRITING",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"part1Prompt":"Some educational theorists propose that remote learning should permanently replace traditional lecture halls in higher education. To what extent do you agree or disagree? Write for 5 minutes (minimum 80 words).","part2Prompt":"What psychological impacts might fully virtual university degree programs have on student collaboration and networking? Write for 3 minutes (minimum 50 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_cohesion_min80_min50"}`),
			TimeLimitSec:   480,
			IsActive:       true,
		},
		{
			ID:             "q-sp-03",
			Type:           "SPEAK_PHOTO",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"imageUrl":"/images/practice/city-skyline.jpg","prompt":"Speak for 90 seconds about the scene in this urban photograph, focusing on architectural dynamics and sustainability."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_pronunciation_vocabulary_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-rts-03",
			Type:           "READ_THEN_SPEAK",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"prompt":"Many sociologists argue that rapid urbanization has eroded local community cohesion in favor of individualized lifestyles. Do you agree with this assessment? Provide concrete reasons and examples. Speak for 90 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"fluency_organization_academic_discourse_min90s"}`),
			TimeLimitSec:   90,
			IsActive:       true,
		},
		{
			ID:             "q-is-03",
			Type:           "INTERACTIVE_SPEAKING",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"scenario":"You are participating in an academic panel debating global carbon offset programs.","prompt":"Explain how verifiable third-party auditing can prevent corporate greenwashing. Speak clearly for 35 seconds."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"conversational_fluency_responsiveness"}`),
			TimeLimitSec:   210,
			IsActive:       true,
		},
		{
			ID:             "q-ws-03",
			Type:           "WRITING_SAMPLE",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"prompt":"Should scientific research funded by public tax revenues be published under open-access mandates without embargo periods, or should academic publishers retain copyright monetization? Defend your viewpoint. Write for 5 minutes (minimum 100 words)."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"academic_argumentation_min100"}`),
			TimeLimitSec:   300,
			IsActive:       true,
		},
		{
			ID:             "q-ss-03",
			Type:           "SPEAKING_SAMPLE",
			DifficultyBand: "C1",
			ContentPayload: json.RawMessage(`{"prompt":"Some experts predict that autonomous artificial intelligence will eliminate more jobs than it creates over the next generation. In your view, will technological disruption exacerbate societal inequality or stimulate new industries? Speak for 1 to 3 minutes."}`),
			CorrectAnswers: json.RawMessage(`{"rubric":"extended_discourse_academic_speech_min180s"}`),
			TimeLimitSec:   180,
			IsActive:       true,
		},
	}

	for i := range questions {
		s.questions[questions[i].ID] = &questions[i]
	}
}

func (s *MemoryStorage) seedInstitutions() {
	institutions := []models.Institution{
		{
			ID:             "inst-harvard",
			Name:           "Harvard University",
			Country:        "United States",
			City:           "Cambridge",
			State:          "MA",
			MinScore:       125,
			SubscoreReqs:   "Рекомендуется от 120 по каждому сабскору",
			Latitude:       42.3770,
			Longitude:      -71.1167,
			WebsiteURL:     "https://www.harvard.edu",
			Category:       "Ivy League",
			AcceptanceRate: "3.4%",
			Programs:       []string{"Undergraduate", "Graduate", "PhD"},
		},
		{
			ID:             "inst-mit",
			Name:           "Massachusetts Institute of Technology (MIT)",
			Country:        "United States",
			City:           "Cambridge",
			State:          "MA",
			MinScore:       125,
			SubscoreReqs:   "Минимум 120 в Literacy & Production",
			Latitude:       42.3601,
			Longitude:      -71.0942,
			WebsiteURL:     "https://www.mit.edu",
			Category:       "Top STEM",
			AcceptanceRate: "4.0%",
			Programs:       []string{"Undergraduate", "Engineering", "Graduate"},
		},
		{
			ID:             "inst-stanford",
			Name:           "Stanford University",
			Country:        "United States",
			City:           "Stanford",
			State:          "CA",
			MinScore:       120,
			SubscoreReqs:   "Конкурентный балл 125+",
			Latitude:       37.4275,
			Longitude:      -122.1697,
			WebsiteURL:     "https://www.stanford.edu",
			Category:       "Top Global",
			AcceptanceRate: "3.9%",
			Programs:       []string{"Undergraduate", "Graduate", "MBA"},
		},
		{
			ID:             "inst-yale",
			Name:           "Yale University",
			Country:        "United States",
			City:           "New Haven",
			State:          "CT",
			MinScore:       125,
			SubscoreReqs:   "Минимум 120 по всем 4 сабскорам",
			Latitude:       41.3163,
			Longitude:      -72.9223,
			WebsiteURL:     "https://www.yale.edu",
			Category:       "Ivy League",
			AcceptanceRate: "4.5%",
			Programs:       []string{"Undergraduate", "Graduate", "Law"},
		},
		{
			ID:             "inst-columbia",
			Name:           "Columbia University",
			Country:        "United States",
			City:           "New York",
			State:          "NY",
			MinScore:       125,
			SubscoreReqs:   "Минимум 125 для бакалавриата",
			Latitude:       40.8075,
			Longitude:      -73.9626,
			WebsiteURL:     "https://www.columbia.edu",
			Category:       "Ivy League",
			AcceptanceRate: "3.9%",
			Programs:       []string{"Undergraduate", "Graduate", "Columbia College"},
		},
		{
			ID:             "inst-princeton",
			Name:           "Princeton University",
			Country:        "United States",
			City:           "Princeton",
			State:          "NJ",
			MinScore:       125,
			SubscoreReqs:   "Рекомендуется 130+",
			Latitude:       40.3440,
			Longitude:      -74.6514,
			WebsiteURL:     "https://www.princeton.edu",
			Category:       "Ivy League",
			AcceptanceRate: "4.4%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-upenn",
			Name:           "University of Pennsylvania",
			Country:        "United States",
			City:           "Philadelphia",
			State:          "PA",
			MinScore:       120,
			SubscoreReqs:   "125+ для Wharton School",
			Latitude:       39.9522,
			Longitude:      -75.1932,
			WebsiteURL:     "https://www.upenn.edu",
			Category:       "Ivy League",
			AcceptanceRate: "5.9%",
			Programs:       []string{"Undergraduate", "Wharton", "Graduate"},
		},
		{
			ID:             "inst-cornell",
			Name:           "Cornell University",
			Country:        "United States",
			City:           "Ithaca",
			State:          "NY",
			MinScore:       120,
			SubscoreReqs:   "120 Literacy & Conversation",
			Latitude:       42.4534,
			Longitude:      -76.4735,
			WebsiteURL:     "https://www.cornell.edu",
			Category:       "Ivy League",
			AcceptanceRate: "7.3%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-nyu",
			Name:           "New York University (NYU)",
			Country:        "United States",
			City:           "New York",
			State:          "NY",
			MinScore:       130,
			SubscoreReqs:   "Строго 130+ для большинства программ",
			Latitude:       40.7295,
			Longitude:      -73.9965,
			WebsiteURL:     "https://www.nyu.edu",
			Category:       "Top Global",
			AcceptanceRate: "8.0%",
			Programs:       []string{"Undergraduate", "Stern", "Tisch", "Graduate"},
		},
		{
			ID:             "inst-uchicago",
			Name:           "University of Chicago",
			Country:        "United States",
			City:           "Chicago",
			State:          "IL",
			MinScore:       125,
			SubscoreReqs:   "125+ по шкале DET",
			Latitude:       41.7886,
			Longitude:      -87.5987,
			WebsiteURL:     "https://www.uchicago.edu",
			Category:       "Top Global",
			AcceptanceRate: "4.8%",
			Programs:       []string{"Undergraduate", "Booth MBA", "Graduate"},
		},
		{
			ID:             "inst-ucla",
			Name:           "University of California, Los Angeles (UCLA)",
			Country:        "United States",
			City:           "Los Angeles",
			State:          "CA",
			MinScore:       120,
			SubscoreReqs:   "Конкурентный 125+",
			Latitude:       34.0689,
			Longitude:      -118.4452,
			WebsiteURL:     "https://www.ucla.edu",
			Category:       "Public Ivy",
			AcceptanceRate: "8.6%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-berkeley",
			Name:           "UC Berkeley",
			Country:        "United States",
			City:           "Berkeley",
			State:          "CA",
			MinScore:       125,
			SubscoreReqs:   "120+ в каждом сабскоре",
			Latitude:       37.8719,
			Longitude:      -122.2585,
			WebsiteURL:     "https://www.berkeley.edu",
			Category:       "Public Ivy",
			AcceptanceRate: "11.6%",
			Programs:       []string{"Undergraduate", "Engineering", "Haas"},
		},
		{
			ID:             "inst-cmu",
			Name:           "Carnegie Mellon University",
			Country:        "United States",
			City:           "Pittsburgh",
			State:          "PA",
			MinScore:       125,
			SubscoreReqs:   "125 Literacy, 120 Conversation",
			Latitude:       40.4432,
			Longitude:      -79.9428,
			WebsiteURL:     "https://www.cmu.edu",
			Category:       "Top STEM",
			AcceptanceRate: "11.0%",
			Programs:       []string{"Computer Science", "Engineering", "Graduate"},
		},
		{
			ID:             "inst-toronto",
			Name:           "University of Toronto",
			Country:        "Canada",
			City:           "Toronto",
			State:          "ON",
			MinScore:       120,
			SubscoreReqs:   "Минимум 120 в Overall",
			Latitude:       43.6629,
			Longitude:      -79.3957,
			WebsiteURL:     "https://www.utoronto.ca",
			Category:       "Canadian Top",
			AcceptanceRate: "43.0%",
			Programs:       []string{"Undergraduate", "Graduate", "Rotman"},
		},
		{
			ID:             "inst-mcgill",
			Name:           "McGill University",
			Country:        "Canada",
			City:           "Montreal",
			State:          "QC",
			MinScore:       115,
			SubscoreReqs:   "120 для отдельных факультетов",
			Latitude:       45.5048,
			Longitude:      -73.5772,
			WebsiteURL:     "https://www.mcgill.ca",
			Category:       "Canadian Top",
			AcceptanceRate: "39.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-ubc",
			Name:           "University of British Columbia (UBC)",
			Country:        "Canada",
			City:           "Vancouver",
			State:          "BC",
			MinScore:       125,
			SubscoreReqs:   "Минимум 115 по каждому сабскору",
			Latitude:       49.2606,
			Longitude:      -123.2460,
			WebsiteURL:     "https://www.ubc.ca",
			Category:       "Canadian Top",
			AcceptanceRate: "44.0%",
			Programs:       []string{"Undergraduate", "Graduate", "Sauder"},
		},
		{
			ID:             "inst-waterloo",
			Name:           "University of Waterloo",
			Country:        "Canada",
			City:           "Waterloo",
			State:          "ON",
			MinScore:       120,
			SubscoreReqs:   "120+ для CS и Инженерии",
			Latitude:       43.4723,
			Longitude:      -80.5449,
			WebsiteURL:     "https://uwaterloo.ca",
			Category:       "Top STEM",
			AcceptanceRate: "53.0%",
			Programs:       []string{"Computer Science", "Engineering", "Math"},
		},
		{
			ID:             "inst-oxford",
			Name:           "University of Oxford",
			Country:        "United Kingdom",
			City:           "Oxford",
			State:          "",
			MinScore:       125,
			SubscoreReqs:   "120+ в каждом сабскоре",
			Latitude:       51.7548,
			Longitude:      -1.2544,
			WebsiteURL:     "https://www.ox.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "14.5%",
			Programs:       []string{"Undergraduate", "Postgraduate"},
		},
		{
			ID:             "inst-cambridge",
			Name:           "University of Cambridge",
			Country:        "United Kingdom",
			City:           "Cambridge",
			State:          "",
			MinScore:       125,
			SubscoreReqs:   "120+ сабскоры",
			Latitude:       52.2043,
			Longitude:      0.1149,
			WebsiteURL:     "https://www.cam.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "16.0%",
			Programs:       []string{"Undergraduate", "Postgraduate"},
		},
		{
			ID:             "inst-imperial",
			Name:           "Imperial College London",
			Country:        "United Kingdom",
			City:           "London",
			State:          "",
			MinScore:       125,
			SubscoreReqs:   "Минимум 115 по каждому элементу",
			Latitude:       51.4988,
			Longitude:      -0.1749,
			WebsiteURL:     "https://www.imperial.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "11.5%",
			Programs:       []string{"Engineering", "Medicine", "Natural Sciences"},
		},
		{
			ID:             "inst-ucl",
			Name:           "University College London (UCL)",
			Country:        "United Kingdom",
			City:           "London",
			State:          "",
			MinScore:       120,
			SubscoreReqs:   "Level 1: 115, Level 2: 125",
			Latitude:       51.5246,
			Longitude:      -0.1340,
			WebsiteURL:     "https://www.ucl.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "15.0%",
			Programs:       []string{"Undergraduate", "Postgraduate"},
		},
		{
			ID:             "inst-edinburgh",
			Name:           "University of Edinburgh",
			Country:        "United Kingdom",
			City:           "Edinburgh",
			State:          "",
			MinScore:       115,
			SubscoreReqs:   "115 Overall",
			Latitude:       55.9445,
			Longitude:      -3.1892,
			WebsiteURL:     "https://www.ed.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "33.0%",
			Programs:       []string{"Undergraduate", "Postgraduate"},
		},
		{
			ID:             "inst-kcl",
			Name:           "King's College London",
			Country:        "United Kingdom",
			City:           "London",
			State:          "",
			MinScore:       120,
			SubscoreReqs:   "Band B/C: 115–125",
			Latitude:       51.5115,
			Longitude:      -0.1160,
			WebsiteURL:     "https://www.kcl.ac.uk",
			Category:       "Russell Group",
			AcceptanceRate: "13.0%",
			Programs:       []string{"Undergraduate", "Law", "Business"},
		},
		{
			ID:             "inst-tum",
			Name:           "Technical University of Munich (TUM)",
			Country:        "Germany",
			City:           "Munich",
			State:          "Bavaria",
			MinScore:       115,
			SubscoreReqs:   "English taught MSc programs",
			Latitude:       48.1479,
			Longitude:      11.5678,
			WebsiteURL:     "https://www.tum.de",
			Category:       "Europe",
			AcceptanceRate: "25.0%",
			Programs:       []string{"Graduate", "Engineering", "Data Science"},
		},
		{
			ID:             "inst-amsterdam",
			Name:           "University of Amsterdam",
			Country:        "Netherlands",
			City:           "Amsterdam",
			State:          "",
			MinScore:       115,
			SubscoreReqs:   "115 Overall, min 105 in subscores",
			Latitude:       52.3558,
			Longitude:      4.9555,
			WebsiteURL:     "https://www.uva.nl",
			Category:       "Europe",
			AcceptanceRate: "20.0%",
			Programs:       []string{"BSc International", "MSc International"},
		},
		{
			ID:             "inst-trinity",
			Name:           "Trinity College Dublin",
			Country:        "Ireland",
			City:           "Dublin",
			State:          "",
			MinScore:       110,
			SubscoreReqs:   "Минимум 110 Overall",
			Latitude:       53.3438,
			Longitude:      -6.2546,
			WebsiteURL:     "https://www.tcd.ie",
			Category:       "Europe",
			AcceptanceRate: "33.5%",
			Programs:       []string{"Undergraduate", "Postgraduate"},
		},
		{
			ID:             "inst-melbourne",
			Name:           "University of Melbourne",
			Country:        "Australia",
			City:           "Melbourne",
			State:          "VIC",
			MinScore:       115,
			SubscoreReqs:   "115-120 в зависимости от программы",
			Latitude:       -37.7964,
			Longitude:      144.9612,
			WebsiteURL:     "https://www.unimelb.edu.au",
			Category:       "Top Global",
			AcceptanceRate: "70.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-sydney",
			Name:           "University of Sydney",
			Country:        "Australia",
			City:           "Sydney",
			State:          "NSW",
			MinScore:       120,
			SubscoreReqs:   "115 minimum in subscores",
			Latitude:       -33.8886,
			Longitude:      151.1873,
			WebsiteURL:     "https://www.sydney.edu.au",
			Category:       "Top Global",
			AcceptanceRate: "30.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-anu",
			Name:           "Australian National University (ANU)",
			Country:        "Australia",
			City:           "Canberra",
			State:          "ACT",
			MinScore:       115,
			SubscoreReqs:   "Overall 115",
			Latitude:       -35.2777,
			Longitude:      149.1185,
			WebsiteURL:     "https://www.anu.edu.au",
			Category:       "Top Global",
			AcceptanceRate: "35.0%",
			Programs:       []string{"Undergraduate", "Research"},
		},
		{
			ID:             "inst-nus",
			Name:           "National University of Singapore (NUS)",
			Country:        "Singapore",
			City:           "Singapore",
			State:          "",
			MinScore:       120,
			SubscoreReqs:   "125+ для Business и Computing",
			Latitude:       1.2966,
			Longitude:      103.7764,
			WebsiteURL:     "https://www.nus.edu.sg",
			Category:       "Top Global",
			AcceptanceRate: "5.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-hku",
			Name:           "University of Hong Kong (HKU)",
			Country:        "Hong Kong",
			City:           "Hong Kong",
			State:          "",
			MinScore:       115,
			SubscoreReqs:   "115 Overall",
			Latitude:       22.2830,
			Longitude:      114.1371,
			WebsiteURL:     "https://www.hku.hk",
			Category:       "Top Global",
			AcceptanceRate: "10.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-georgia-tech",
			Name:           "Georgia Institute of Technology",
			Country:        "United States",
			City:           "Atlanta",
			State:          "GA",
			MinScore:       120,
			SubscoreReqs:   "115+ в Literacy",
			Latitude:       33.7756,
			Longitude:      -84.3963,
			WebsiteURL:     "https://www.gatech.edu",
			Category:       "Top STEM",
			AcceptanceRate: "16.0%",
			Programs:       []string{"Engineering", "Computing", "Science"},
		},
		{
			ID:             "inst-uw-seattle",
			Name:           "University of Washington",
			Country:        "United States",
			City:           "Seattle",
			State:          "WA",
			MinScore:       110,
			SubscoreReqs:   "120 рекомендовано",
			Latitude:       47.6553,
			Longitude:      -122.3035,
			WebsiteURL:     "https://www.washington.edu",
			Category:       "Public Ivy",
			AcceptanceRate: "48.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-ut-austin",
			Name:           "University of Texas at Austin",
			Country:        "United States",
			City:           "Austin",
			State:          "TX",
			MinScore:       115,
			SubscoreReqs:   "120 для McCombs & Engineering",
			Latitude:       30.2849,
			Longitude:      -97.7341,
			WebsiteURL:     "https://www.utexas.edu",
			Category:       "Public Ivy",
			AcceptanceRate: "29.0%",
			Programs:       []string{"Undergraduate", "Graduate"},
		},
		{
			ID:             "inst-purdue",
			Name:           "Purdue University",
			Country:        "United States",
			City:           "West Lafayette",
			State:          "IN",
			MinScore:       115,
			SubscoreReqs:   "115 Overall, 115 subscores",
			Latitude:       40.4237,
			Longitude:      -86.9212,
			WebsiteURL:     "https://www.purdue.edu",
			Category:       "Top STEM",
			AcceptanceRate: "50.0%",
			Programs:       []string{"Engineering", "Aviation", "CS"},
		},
	}

	for i := range institutions {
		s.institutions[institutions[i].ID] = &institutions[i]
	}
}

// --- Users Memory Repo ---

type userMemoryRepo struct{ s *MemoryStorage }

func (r *userMemoryRepo) Create(ctx context.Context, u *models.User) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if _, exists := r.s.usersByEmail[u.Email]; exists {
		return errors.New("user already exists")
	}
	r.s.users[u.ID] = u
	r.s.usersByEmail[u.Email] = u
	return nil
}

func (r *userMemoryRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	u, ok := r.s.users[id]
	if !ok {
		return nil, errors.New("user not found")
	}
	return u, nil
}

func (r *userMemoryRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	u, ok := r.s.usersByEmail[email]
	if !ok {
		return nil, errors.New("user not found")
	}
	return u, nil
}

func (r *userMemoryRepo) Update(ctx context.Context, u *models.User) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.users[u.ID] = u
	r.s.usersByEmail[u.Email] = u
	return nil
}

func (r *userMemoryRepo) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	u, ok := r.s.users[id]
	if !ok {
		return errors.New("user not found")
	}
	u.PasswordHash = passwordHash
	u.UpdatedAt = time.Now().UTC()
	return nil
}

func (r *userMemoryRepo) UpdateRole(ctx context.Context, id, role string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	u, ok := r.s.users[id]
	if !ok {
		return errors.New("user not found")
	}
	u.Role = role
	u.UpdatedAt = time.Now().UTC()
	return nil
}

func (r *userMemoryRepo) Delete(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	u, ok := r.s.users[id]
	if !ok {
		return errors.New("user not found")
	}
	delete(r.s.usersByEmail, u.Email)
	delete(r.s.users, id)
	delete(r.s.socialAccounts, id)
	return nil
}

func (r *userMemoryRepo) GetSocialAccounts(ctx context.Context, userID string) ([]models.SocialAccount, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	return r.s.socialAccounts[userID], nil
}

func (r *userMemoryRepo) GetSocialAccountByProviderUID(ctx context.Context, provider, providerUID string) (*models.SocialAccount, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	for _, list := range r.s.socialAccounts {
		for _, sa := range list {
			if sa.Provider == provider && sa.ProviderUserID == providerUID {
				return &sa, nil
			}
		}
	}
	return nil, errors.New("social account not found")
}

func (r *userMemoryRepo) LinkSocialAccount(ctx context.Context, sa *models.SocialAccount) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	list := r.s.socialAccounts[sa.UserID]
	// Replace if provider already exists for user
	found := false
	for i, item := range list {
		if item.Provider == sa.Provider {
			list[i] = *sa
			found = true
			break
		}
	}
	if !found {
		list = append(list, *sa)
	}
	r.s.socialAccounts[sa.UserID] = list
	return nil
}

func (r *userMemoryRepo) UnlinkSocialAccount(ctx context.Context, userID, provider string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	list := r.s.socialAccounts[userID]
	var updated []models.SocialAccount
	for _, sa := range list {
		if sa.Provider != provider {
			updated = append(updated, sa)
		}
	}
	r.s.socialAccounts[userID] = updated
	return nil
}

func (r *userMemoryRepo) ListAll(ctx context.Context, page, limit int, search, role string) ([]models.User, int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	var result []models.User
	searchLower := strings.ToLower(search)

	for _, u := range r.s.users {
		if role != "" && u.Role != role {
			continue
		}
		if search != "" {
			nameLower := strings.ToLower(u.Name)
			emailLower := strings.ToLower(u.Email)
			if !strings.Contains(nameLower, searchLower) && !strings.Contains(emailLower, searchLower) {
				continue
			}
		}
		result = append(result, *u)
	}

	total := len(result)
	return result, total, nil
}

// --- Theory Memory Repo ---

type theoryMemoryRepo struct{ s *MemoryStorage }

func (r *theoryMemoryRepo) GetUserProgress(ctx context.Context, userID string) ([]string, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	userMap, ok := r.s.theory[userID]
	if !ok {
		return []string{}, nil
	}
	var completed []string
	for slug, isDone := range userMap {
		if isDone {
			completed = append(completed, slug)
		}
	}
	return completed, nil
}

func (r *theoryMemoryRepo) ToggleProgress(ctx context.Context, userID, lessonSlug string) (bool, error) {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if _, ok := r.s.theory[userID]; !ok {
		r.s.theory[userID] = make(map[string]bool)
	}
	current := r.s.theory[userID][lessonSlug]
	next := !current
	r.s.theory[userID][lessonSlug] = next
	return next, nil
}

func (r *theoryMemoryRepo) SetProgress(ctx context.Context, userID, lessonSlug string, completed bool) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if _, ok := r.s.theory[userID]; !ok {
		r.s.theory[userID] = make(map[string]bool)
	}
	r.s.theory[userID][lessonSlug] = completed
	return nil
}

// --- Question Memory Repo ---

type questionMemoryRepo struct{ s *MemoryStorage }

func (r *questionMemoryRepo) ListByTypeAndDifficulty(ctx context.Context, qType, difficultyBand string) ([]models.Question, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.Question
	for _, q := range r.s.questions {
		if !q.IsActive {
			continue
		}
		if qType != "" && q.Type != qType {
			continue
		}
		if difficultyBand != "" && q.DifficultyBand != difficultyBand {
			continue
		}
		list = append(list, *q)
	}
	for i := 0; i < len(list); i++ {
		for j := i + 1; j < len(list); j++ {
			if list[j].ID < list[i].ID {
				list[i], list[j] = list[j], list[i]
			}
		}
	}
	return list, nil
}

func (r *questionMemoryRepo) GetByID(ctx context.Context, id string) (*models.Question, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	q, ok := r.s.questions[id]
	if !ok {
		return nil, errors.New("question not found")
	}
	return q, nil
}

func (r *questionMemoryRepo) ListAllActive(ctx context.Context) ([]models.Question, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.Question
	for _, q := range r.s.questions {
		list = append(list, *q)
	}
	return list, nil
}

func (r *questionMemoryRepo) Create(ctx context.Context, q *models.Question) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.questions[q.ID] = q
	return nil
}

func (r *questionMemoryRepo) Delete(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	delete(r.s.questions, id)
	return nil
}

func (r *questionMemoryRepo) Count(ctx context.Context) (int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	return len(r.s.questions), nil
}

// --- Test Session Memory Repo ---

type sessionMemoryRepo struct{ s *MemoryStorage }

func (r *sessionMemoryRepo) Create(ctx context.Context, session *models.TestSession) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.sessions[session.ID] = session
	return nil
}

func (r *sessionMemoryRepo) GetByID(ctx context.Context, id string) (*models.TestSession, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	sess, ok := r.s.sessions[id]
	if !ok {
		return nil, errors.New("session not found")
	}
	return sess, nil
}

func (r *sessionMemoryRepo) Update(ctx context.Context, session *models.TestSession) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.sessions[session.ID] = session
	return nil
}

func (r *sessionMemoryRepo) AssignQuestions(ctx context.Context, assignments []models.SessionQuestion) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	for _, assignment := range assignments {
		found := false
		for _, existing := range r.s.sessionQuestions[assignment.SessionID] {
			if existing.QuestionID == assignment.QuestionID {
				found = true
				break
			}
		}
		if !found {
			r.s.sessionQuestions[assignment.SessionID] = append(r.s.sessionQuestions[assignment.SessionID], assignment)
		}
	}
	return nil
}

func (r *sessionMemoryRepo) GetAssignedQuestions(ctx context.Context, sessionID, stageName string) ([]models.SessionQuestion, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	result := []models.SessionQuestion{}
	for _, assignment := range r.s.sessionQuestions[sessionID] {
		if stageName == "" || assignment.StageName == stageName {
			result = append(result, assignment)
		}
	}
	return result, nil
}

func (r *sessionMemoryRepo) GetAllAssignedQuestions(ctx context.Context, sessionID string) ([]models.SessionQuestion, error) {
	return r.GetAssignedQuestions(ctx, sessionID, "")
}

func (r *sessionMemoryRepo) GetAssignedQuestion(ctx context.Context, sessionID, questionID string) (*models.SessionQuestion, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	for _, assignment := range r.s.sessionQuestions[sessionID] {
		if assignment.QuestionID == questionID {
			copyAssignment := assignment
			return &copyAssignment, nil
		}
	}
	return nil, errors.New("question was not issued for this attempt")
}

func (r *sessionMemoryRepo) RecordEvent(ctx context.Context, event *models.SessionEvent) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.events[event.SessionID] = append(r.s.events[event.SessionID], *event)
	return nil
}

func (r *sessionMemoryRepo) GetSessionEvents(ctx context.Context, sessionID string) ([]models.SessionEvent, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	events := r.s.events[sessionID]
	if events == nil {
		events = []models.SessionEvent{}
	}
	return events, nil
}

func (r *sessionMemoryRepo) WithSessionLock(ctx context.Context, sessionID string, fn func() error) error {
	r.s.sessionLockMu.Lock()
	lock, ok := r.s.sessionLocks[sessionID]
	if !ok {
		lock = &sync.Mutex{}
		r.s.sessionLocks[sessionID] = lock
	}
	r.s.sessionLockMu.Unlock()

	lock.Lock()
	defer lock.Unlock()
	return fn()
}

func (r *sessionMemoryRepo) RecordResponse(ctx context.Context, resp *models.QuestionResponse) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	items := r.s.responses[resp.SessionID]
	for i := range items {
		if items[i].QuestionID == resp.QuestionID {
			items[i] = *resp
			r.s.responses[resp.SessionID] = items
			return nil
		}
	}
	r.s.responses[resp.SessionID] = append(items, *resp)
	return nil
}

func (r *sessionMemoryRepo) GetSessionResponses(ctx context.Context, sessionID string) ([]models.QuestionResponse, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	return r.s.responses[sessionID], nil
}

func (r *sessionMemoryRepo) GetUserSessions(ctx context.Context, userID string) ([]models.TestSession, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.TestSession
	for _, s := range r.s.sessions {
		if s.UserID == userID {
			list = append(list, *s)
		}
	}
	return list, nil
}

func (r *sessionMemoryRepo) ListRecent(ctx context.Context, limit int) ([]models.TestSession, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.TestSession
	for _, s := range r.s.sessions {
		list = append(list, *s)
		if len(list) >= limit {
			break
		}
	}
	return list, nil
}

func (r *sessionMemoryRepo) GetStats(ctx context.Context) (int, int, float64, map[string]int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	total := len(r.s.sessions)
	completed := 0
	sumScore := 0
	scoreCount := 0
	scoreDist := map[string]int{
		"10-60 (A2)":    0,
		"65-95 (B1)":    0,
		"100-125 (B2)":  0,
		"130-160 (C1+)": 0,
	}

	for _, s := range r.s.sessions {
		if s.Status == "COMPLETED" {
			completed++
			if s.OverallScore != nil {
				sc := *s.OverallScore
				sumScore += sc
				scoreCount++
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
	if scoreCount > 0 {
		avg = float64(sumScore) / float64(scoreCount)
	}

	return total, completed, avg, scoreDist, nil
}

func (r *sessionMemoryRepo) SaveEvaluation(ctx context.Context, eval *models.EvaluationResult) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.evaluations[eval.SessionID] = append(r.s.evaluations[eval.SessionID], *eval)
	return nil
}

func (r *sessionMemoryRepo) GetSessionEvaluations(ctx context.Context, sessionID string) ([]models.EvaluationResult, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	evals := r.s.evaluations[sessionID]
	if evals == nil {
		return []models.EvaluationResult{}, nil
	}
	res := make([]models.EvaluationResult, len(evals))
	copy(res, evals)
	return res, nil
}

func (r *sessionMemoryRepo) SaveMediaAsset(ctx context.Context, asset *models.MediaAsset) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.mediaAssets[asset.ID] = asset
	return nil
}

func (r *sessionMemoryRepo) GetMediaAssetByID(ctx context.Context, id string) (*models.MediaAsset, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	asset, ok := r.s.mediaAssets[id]
	if !ok {
		return nil, errors.New("media asset not found")
	}
	return asset, nil
}

// --- Certificate Memory Repo ---

type certMemoryRepo struct{ s *MemoryStorage }

func (r *certMemoryRepo) Create(ctx context.Context, cert *models.Certificate) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.certificates[cert.ID] = cert
	return nil
}

func (r *certMemoryRepo) GetByID(ctx context.Context, id string) (*models.Certificate, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	c, ok := r.s.certificates[id]
	if !ok {
		return nil, errors.New("certificate not found")
	}
	return c, nil
}

func (r *certMemoryRepo) GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.Certificate
	for _, c := range r.s.certificates {
		if c.UserID == userID {
			list = append(list, *c)
		}
	}
	return list, nil
}

func (r *certMemoryRepo) GetBySessionID(ctx context.Context, sessionID string) (*models.Certificate, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	for _, c := range r.s.certificates {
		if c.TestSessionID == sessionID {
			return c, nil
		}
	}
	return nil, errors.New("certificate not found for session")
}

func (r *certMemoryRepo) Count(ctx context.Context) (int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	return len(r.s.certificates), nil
}

// --- Banner Memory Repo ---

type bannerMemoryRepo struct{ s *MemoryStorage }

func (r *bannerMemoryRepo) GetActiveByPlacement(ctx context.Context, placement string) ([]models.AdBanner, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.AdBanner
	for _, b := range r.s.banners {
		if b.IsActive && (placement == "" || b.Placement == placement) {
			list = append(list, *b)
		}
	}
	return list, nil
}

func (r *bannerMemoryRepo) ListAll(ctx context.Context) ([]models.AdBanner, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	var list []models.AdBanner
	for _, b := range r.s.banners {
		list = append(list, *b)
	}
	return list, nil
}

func (r *bannerMemoryRepo) Create(ctx context.Context, b *models.AdBanner) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.banners[b.ID] = b
	return nil
}

func (r *bannerMemoryRepo) Update(ctx context.Context, b *models.AdBanner) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.banners[b.ID] = b
	return nil
}

func (r *bannerMemoryRepo) Delete(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	delete(r.s.banners, id)
	return nil
}

func (r *bannerMemoryRepo) RecordClick(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if b, ok := r.s.banners[id]; ok {
		b.Clicks++
	}
	return nil
}

func (r *bannerMemoryRepo) RecordImpression(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if b, ok := r.s.banners[id]; ok {
		b.Impressions++
	}
	return nil
}

func (r *bannerMemoryRepo) GetStats(ctx context.Context) (int, int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	active := 0
	clicks := 0
	for _, b := range r.s.banners {
		if b.IsActive {
			active++
		}
		clicks += b.Clicks
	}
	return active, clicks, nil
}

// --- Institution Memory Repo ---

type institutionMemoryRepo struct{ s *MemoryStorage }

func (r *institutionMemoryRepo) List(ctx context.Context, search, country string, minScore int, category string) ([]models.Institution, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()

	var list []models.Institution
	searchLower := strings.ToLower(search)
	countryLower := strings.ToLower(country)
	categoryLower := strings.ToLower(category)

	for _, inst := range r.s.institutions {
		if minScore > 0 && inst.MinScore > minScore {
			continue
		}
		if country != "" && !strings.Contains(strings.ToLower(inst.Country), countryLower) {
			continue
		}
		if category != "" && !strings.Contains(strings.ToLower(inst.Category), categoryLower) {
			continue
		}
		if search != "" {
			nameMatch := strings.Contains(strings.ToLower(inst.Name), searchLower)
			cityMatch := strings.Contains(strings.ToLower(inst.City), searchLower)
			countryMatch := strings.Contains(strings.ToLower(inst.Country), searchLower)
			if !nameMatch && !cityMatch && !countryMatch {
				continue
			}
		}
		list = append(list, *inst)
	}

	return list, nil
}

func (r *institutionMemoryRepo) GetByID(ctx context.Context, id string) (*models.Institution, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	inst, ok := r.s.institutions[id]
	if !ok {
		return nil, errors.New("institution not found")
	}
	return inst, nil
}

func (r *institutionMemoryRepo) Create(ctx context.Context, inst *models.Institution) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.institutions[inst.ID] = inst
	return nil
}

func (r *institutionMemoryRepo) Update(ctx context.Context, inst *models.Institution) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.institutions[inst.ID] = inst
	return nil
}

func (r *institutionMemoryRepo) Delete(ctx context.Context, id string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	delete(r.s.institutions, id)
	return nil
}

func (r *institutionMemoryRepo) Count(ctx context.Context) (int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	return len(r.s.institutions), nil
}

// --- Study, Goals, Error Notebook and SRS ---

type studyMemoryRepo struct {
	s *MemoryStorage
}

func (r *studyMemoryRepo) GetGoals(ctx context.Context, userID string) (*models.UserGoal, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	g, ok := r.s.goals[userID]
	if !ok {
		return nil, errors.New("goals not found")
	}
	cp := *g
	return &cp, nil
}

func (r *studyMemoryRepo) UpsertGoals(ctx context.Context, goal *models.UserGoal) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	cp := *goal
	cp.UpdatedAt = time.Now()
	r.s.goals[goal.UserID] = &cp
	return nil
}

func (r *studyMemoryRepo) GetErrors(ctx context.Context, userID string) ([]models.UserErrorItem, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	userMap, ok := r.s.errors[userID]
	if !ok {
		return []models.UserErrorItem{}, nil
	}
	res := make([]models.UserErrorItem, 0, len(userMap))
	for _, item := range userMap {
		res = append(res, *item)
	}
	return res, nil
}

func (r *studyMemoryRepo) GetErrorByID(ctx context.Context, userID, errorID string) (*models.UserErrorItem, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	userMap, ok := r.s.errors[userID]
	if !ok {
		return nil, errors.New("error item not found")
	}
	item, ok := userMap[errorID]
	if !ok {
		return nil, errors.New("error item not found")
	}
	cp := *item
	return &cp, nil
}

func (r *studyMemoryRepo) SaveError(ctx context.Context, item *models.UserErrorItem) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if _, ok := r.s.errors[item.UserID]; !ok {
		r.s.errors[item.UserID] = make(map[string]*models.UserErrorItem)
	}
	cp := *item
	r.s.errors[item.UserID][item.ID] = &cp
	return nil
}

func (r *studyMemoryRepo) DeleteError(ctx context.Context, userID, errorID string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if userMap, ok := r.s.errors[userID]; ok {
		delete(userMap, errorID)
	}
	return nil
}

func (r *studyMemoryRepo) RecordActivity(ctx context.Context, userID, activityDate, source string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if r.s.activity[userID] == nil {
		r.s.activity[userID] = map[string]bool{}
	}
	r.s.activity[userID][activityDate] = true
	return nil
}

func (r *studyMemoryRepo) GetActivityDates(ctx context.Context, userID string, limit int) ([]string, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	dates := []string{}
	for date := range r.s.activity[userID] {
		dates = append(dates, date)
	}
	// newest first
	for i := 0; i < len(dates); i++ {
		for j := i + 1; j < len(dates); j++ {
			if dates[j] > dates[i] {
				dates[i], dates[j] = dates[j], dates[i]
			}
		}
	}
	if limit > 0 && len(dates) > limit {
		dates = dates[:limit]
	}
	return dates, nil
}

func (r *studyMemoryRepo) GetSRSStats(ctx context.Context, userID string) (*models.SRSStats, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	stats, ok := r.s.srsStats[userID]
	if !ok {
		return &models.SRSStats{StreakDays: 0, LastStudiedDate: "", TotalReviewed: 0}, nil
	}
	cp := *stats
	return &cp, nil
}

func (r *studyMemoryRepo) SaveSRSStats(ctx context.Context, userID string, stats *models.SRSStats) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	cp := *stats
	r.s.srsStats[userID] = &cp
	return nil
}

func (r *studyMemoryRepo) GetSRSCards(ctx context.Context, userID string) (map[string]models.SRSCardProgress, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	userMap, ok := r.s.srsCards[userID]
	if !ok {
		return make(map[string]models.SRSCardProgress), nil
	}
	res := make(map[string]models.SRSCardProgress, len(userMap))
	for k, v := range userMap {
		res[k] = *v
	}
	return res, nil
}

func (r *studyMemoryRepo) SaveSRSCard(ctx context.Context, userID string, card *models.SRSCardProgress) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	if _, ok := r.s.srsCards[userID]; !ok {
		r.s.srsCards[userID] = make(map[string]*models.SRSCardProgress)
	}
	cp := *card
	r.s.srsCards[userID][card.CardID] = &cp
	return nil
}

// --- Vocabulary ---

type vocabularyMemoryRepo struct{ s *MemoryStorage }

func (r *vocabularyMemoryRepo) List(ctx context.Context, search, level string) ([]models.VocabularyEntry, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	normalized := strings.ToLower(strings.TrimSpace(search))
	entries := []models.VocabularyEntry{}
	for _, entry := range r.s.vocabulary {
		if entry.Status != "published" {
			continue
		}
		if level != "" && level != "ALL" && entry.Level != level {
			continue
		}
		if normalized != "" &&
			!strings.Contains(strings.ToLower(entry.Word), normalized) &&
			!strings.Contains(strings.ToLower(entry.MeaningRu), normalized) &&
			!strings.Contains(strings.ToLower(entry.DefinitionEn), normalized) {
			continue
		}
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Word < entries[j].Word })
	return entries, nil
}

func (r *vocabularyMemoryRepo) ListAll(ctx context.Context) ([]models.VocabularyEntry, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	entries := []models.VocabularyEntry{}
	for _, entry := range r.s.vocabulary {
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Word < entries[j].Word })
	return entries, nil
}

func (r *vocabularyMemoryRepo) UpdateStatus(ctx context.Context, id, status string) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	entry, ok := r.s.vocabulary[id]
	if !ok {
		return errors.New("vocabulary entry not found")
	}
	entry.Status = status
	entry.ReviewedAt = time.Now().UTC()
	r.s.vocabulary[id] = entry
	return nil
}

func (r *vocabularyMemoryRepo) Count(ctx context.Context) (int, error) {
	r.s.mu.RLock()
	defer r.s.mu.RUnlock()
	count := 0
	for _, entry := range r.s.vocabulary {
		if entry.Status == "published" {
			count++
		}
	}
	return count, nil
}

// --- OAuth transactions ---

type oauthTransactionMemoryRepo struct{ s *MemoryStorage }

func (r *oauthTransactionMemoryRepo) Create(ctx context.Context, transaction *models.OAuthTransaction) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	r.s.oauthTransactions[transaction.StateHash] = *transaction
	return nil
}

func (r *oauthTransactionMemoryRepo) Consume(ctx context.Context, stateHash, provider string) (*models.OAuthTransaction, error) {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	transaction, ok := r.s.oauthTransactions[stateHash]
	if !ok || transaction.Provider != provider {
		return nil, errors.New("oauth transaction not found")
	}
	if transaction.ConsumedAt != nil {
		return nil, errors.New("oauth transaction already consumed")
	}
	if time.Now().After(transaction.ExpiresAt) {
		return nil, errors.New("oauth transaction expired")
	}
	now := time.Now().UTC()
	transaction.ConsumedAt = &now
	r.s.oauthTransactions[stateHash] = transaction
	return &transaction, nil
}

func (r *oauthTransactionMemoryRepo) CleanupExpired(ctx context.Context) error {
	r.s.mu.Lock()
	defer r.s.mu.Unlock()
	for key, transaction := range r.s.oauthTransactions {
		if time.Now().After(transaction.ExpiresAt.Add(time.Hour)) {
			delete(r.s.oauthTransactions, key)
		}
	}
	return nil
}
