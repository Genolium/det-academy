package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
)

type StudyService struct {
	storage       repository.Storage
	theoryService *TheoryService
	catService    *CATService
}

func NewStudyService(storage repository.Storage, theoryService *TheoryService, catService *CATService) *StudyService {
	return &StudyService{
		storage:       storage,
		theoryService: theoryService,
		catService:    catService,
	}
}

func intVal(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func timeVal(p *time.Time) time.Time {
	if p == nil {
		return time.Time{}
	}
	return *p
}

// --- Goals & Personalized Study Plan ---

func (s *StudyService) GetGoals(ctx context.Context, userID string) (*models.UserGoal, error) {
	goal, err := s.storage.Study().GetGoals(ctx, userID)
	if err != nil || goal == nil {
		// Default goal: 125 target score, 30 days from now, 45 min/day, Toronto
		defaultDate := time.Now().AddDate(0, 1, 0).Format("2006-01-02")
		defaultGoal := &models.UserGoal{
			UserID:             userID,
			TargetScore:        125,
			TargetDate:         defaultDate,
			DailyMinutes:       45,
			TargetUniversityID: "toronto",
			UpdatedAt:          time.Now(),
		}
		_ = s.storage.Study().UpsertGoals(ctx, defaultGoal)
		return defaultGoal, nil
	}
	return goal, nil
}

func (s *StudyService) UpdateGoals(ctx context.Context, userID string, req models.UpdateGoalsRequest) (*models.UserGoal, error) {
	if req.TargetScore < 60 || req.TargetScore > 160 {
		req.TargetScore = 125
	}
	if req.DailyMinutes < 15 || req.DailyMinutes > 240 {
		req.DailyMinutes = 45
	}
	if req.TargetDate == "" {
		req.TargetDate = time.Now().AddDate(0, 1, 0).Format("2006-01-02")
	}

	goal := &models.UserGoal{
		UserID:             userID,
		TargetScore:        req.TargetScore,
		TargetDate:         req.TargetDate,
		DailyMinutes:       req.DailyMinutes,
		TargetUniversityID: req.TargetUniversityID,
		UpdatedAt:          time.Now(),
	}

	if err := s.storage.Study().UpsertGoals(ctx, goal); err != nil {
		return nil, fmt.Errorf("failed to save user goals: %w", err)
	}

	return goal, nil
}

func (s *StudyService) GetStudyPlan(ctx context.Context, userID string) (*models.StudyPlanResponse, error) {
	goal, err := s.GetGoals(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Calculate days remaining
	targetTime, parseErr := time.Parse("2006-01-02", goal.TargetDate)
	if parseErr != nil {
		targetTime = time.Now().AddDate(0, 1, 0)
	}
	daysRemaining := int(math.Ceil(time.Until(targetTime).Hours() / 24))
	if daysRemaining < 1 {
		daysRemaining = 1
	}

	// Get user test sessions
	sessions, _ := s.catService.GetUserSessions(ctx, userID)
	var completedSessions []models.TestSession
	for _, sess := range sessions {
		if sess.Status == "COMPLETED" && intVal(sess.OverallScore) > 0 {
			completedSessions = append(completedSessions, sess)
		}
	}

	// Sort sessions by completedAt descending
	sort.Slice(completedSessions, func(i, j int) bool {
		return timeVal(completedSessions[i].CompletedAt).After(timeVal(completedSessions[j].CompletedAt))
	})

	currentEstimate := 0
	weakestSkill := "Не определено (требуется диагностический тест)"
	lowestScore := 161

	if len(completedSessions) > 0 {
		latest := completedSessions[0]
		// Use the latest confirmed attempt, not the best historical score.
		currentEstimate = intVal(latest.OverallScore)

		// Analyze lowest modality
		modalities := []struct {
			name  string
			score int
		}{
			{"Speaking (Устная речь)", intVal(latest.SpeakingScore)},
			{"Writing (Письменная речь)", intVal(latest.WritingScore)},
			{"Reading (Чтение)", intVal(latest.ReadingScore)},
			{"Listening (Аудирование)", intVal(latest.ListeningScore)},
		}

		for _, m := range modalities {
			if m.score > 0 && m.score < lowestScore {
				lowestScore = m.score
				weakestSkill = m.name
			}
		}
	}

	// Theory progress against the actual published lesson slugs.
	allLessonSlugs := []string{
		"rules-and-technicalities", "subscores-and-cat-engine", "read-and-select",
		"listen-and-select", "fill-in-the-blanks", "read-and-complete",
		"listen-and-type", "read-aloud", "interactive-reading",
		"interactive-listening", "write-about-photo", "interactive-writing",
		"writing-sample", "speak-about-photo", "read-listen-speak", "speaking-sample",
	}
	theoryProgress, _ := s.storage.Theory().GetUserProgress(ctx, userID)
	validLessons := map[string]bool{}
	for _, slug := range allLessonSlugs {
		validLessons[slug] = true
	}
	completedValid := 0
	for _, slug := range theoryProgress {
		if validLessons[slug] {
			completedValid++
		}
	}
	theoryPct := float64(completedValid) / float64(len(allLessonSlugs))
	if theoryPct > 1.0 {
		theoryPct = 1.0
	}

	mockRatio := 0.0
	if currentEstimate > 0 {
		mockRatio = math.Min(1.0, float64(currentEstimate)/float64(goal.TargetScore))
	}
	readinessPercent := int(math.Round(theoryPct*40.0 + mockRatio*60.0))

	weeklyHours := float64(goal.DailyMinutes*7) / 60.0

	// Build dynamic daily tasks
	var tasks []models.DailyTask

	// Task 1: SRS Flashcards review
	srsState, _ := s.GetSRSState(ctx, userID)
	totalDue := 0
	if srsState != nil {
		totalDue = srsState.OverdueCount + srsState.DueTodayCount
	}

	if totalDue > 0 {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-srs",
			Type:        "srs",
			Title:       "Интервальное повторение AWL",
			Description: fmt.Sprintf("К повторению сегодня: %d карточек академической лексики по алгоритму SuperMemo SM-2", totalDue),
			ActionURL:   "/practice/flashcards",
			Count:       totalDue,
			Priority:    "HIGH",
			Completed:   false,
		})
	} else {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-srs",
			Type:        "srs",
			Title:       "Изучение новых слов AWL",
			Description: "Все карточки на сегодня повторены! Изучите 10 новых терминов C1/C2",
			ActionURL:   "/practice/flashcards",
			Count:       10,
			Priority:    "MEDIUM",
			Completed:   true,
		})
	}

	// Task 2: Error Notebook Recall
	errorsList, _ := s.storage.Study().GetErrors(ctx, userID)
	unmasteredCount := 0
	for _, errItem := range errorsList {
		if !errItem.Mastered {
			unmasteredCount++
		}
	}

	if unmasteredCount > 0 {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-errors",
			Type:        "error_recall",
			Title:       "Тетрадь ошибок: повторная отработка",
			Description: fmt.Sprintf("%d сложных заданий ждут решения (требуется 2 верных ответа подряд для усвоения)", unmasteredCount),
			ActionURL:   "/dashboard#errors",
			Count:       unmasteredCount,
			Priority:    "HIGH",
			Completed:   false,
		})
	}

	// Task 3: Targeted Weakest Skill Drill
	if strings.Contains(weakestSkill, "Speaking") {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-drill",
			Type:        "practice_drill",
			Title:       "Интенсив: Устная речь (Speaking)",
			Description: "Отработайте упражнения Interactive Speaking и Speak About Photo для роста беглости (WPM) и диверсификации лексики",
			ActionURL:   "/practice",
			Priority:    "HIGH",
			Completed:   false,
		})
	} else if strings.Contains(weakestSkill, "Writing") {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-drill",
			Type:        "practice_drill",
			Title:       "Интенсив: Академическое письмо (Writing)",
			Description: "Напишите развернутый Writing Sample с использованием академических коннекторов и академического вокабуляра",
			ActionURL:   "/practice",
			Priority:    "HIGH",
			Completed:   false,
		})
	} else if strings.Contains(weakestSkill, "Reading") {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-drill",
			Type:        "practice_drill",
			Title:       "Интенсив: Чтение и C-Test (Reading)",
			Description: "Пройдите тренировку Read and Complete для автоматизма восстановления морфем в академическом контексте",
			ActionURL:   "/practice",
			Priority:    "MEDIUM",
			Completed:   false,
		})
	} else {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-drill",
			Type:        "practice_drill",
			Title:       "Адаптивный контрольный тест DET",
			Description: "Пройдите симулятор тестирования (13 типов заданий) для калибровки текущей готовности",
			ActionURL:   "/test",
			Priority:    "MEDIUM",
			Completed:   false,
		})
	}

	// Task 4: Theory Module
	completedSlugs := make(map[string]bool)
	for _, sl := range theoryProgress {
		completedSlugs[sl] = true
	}
	var nextLessonSlug string
	for _, sl := range allLessonSlugs {
		if !completedSlugs[sl] {
			nextLessonSlug = sl
			break
		}
	}

	if nextLessonSlug != "" {
		tasks = append(tasks, models.DailyTask{
			ID:          "task-theory",
			Type:        "theory",
			Title:       fmt.Sprintf("Урок теории: %s", nextLessonSlug),
			Description: "Изучите формат, официальные рубрики оценки и типичные ловушки прокторов",
			ActionURL:   fmt.Sprintf("/theory/%s", nextLessonSlug),
			Priority:    "MEDIUM",
			Completed:   false,
		})
	}

	// Status message
	statusMsg := fmt.Sprintf(
		"До намеченного экзамена осталось %d дн. При бюджете %d мин/день вы успеваете завершить полную программу.",
		daysRemaining, goal.DailyMinutes,
	)
	if currentEstimate > 0 && currentEstimate < goal.TargetScore {
		statusMsg += fmt.Sprintf(" Текущий ориентир: %d баллов. До целевого балла %d осталось набрать %d баллов.",
			currentEstimate, goal.TargetScore, goal.TargetScore-currentEstimate)
	}

	today := time.Now().UTC().Format("2006-01-02")
	completions, _ := s.storage.Study().GetPlanTaskCompletions(ctx, userID, today)
	for index := range tasks {
		if completedAt, ok := completions[tasks[index].ID]; ok {
			tasks[index].Completed = true
			tasks[index].CompletedAt = completedAt.Format(time.RFC3339)
		}
	}

	return &models.StudyPlanResponse{
		TargetScore:       goal.TargetScore,
		TargetDate:        goal.TargetDate,
		DaysRemaining:     daysRemaining,
		DailyMinutes:      goal.DailyMinutes,
		CurrentEstimate:   currentEstimate,
		WeakestSkill:      weakestSkill,
		WeeklyHoursNeeded: weeklyHours,
		ReadinessPercent:  readinessPercent,
		StatusMessage:     statusMsg,
		TasksToday:        tasks,
	}, nil
}

// --- Error Notebook with 2-Recall Cycle ---

func (s *StudyService) GetErrors(ctx context.Context, userID string) ([]models.UserErrorItem, error) {
	return s.storage.Study().GetErrors(ctx, userID)
}

func (s *StudyService) SaveError(ctx context.Context, userID string, req models.SaveErrorRequest) (*models.UserErrorItem, error) {
	if strings.TrimSpace(req.Prompt) == "" || strings.TrimSpace(req.CorrectAnswer) == "" {
		return nil, errors.New("prompt and correctAnswer are required")
	}

	// Deduplicate active identical unmastered errors
	existing, _ := s.storage.Study().GetErrors(ctx, userID)
	for _, e := range existing {
		if e.Prompt == req.Prompt && e.CorrectAnswer == req.CorrectAnswer && !e.Mastered {
			return &e, nil
		}
	}

	item := &models.UserErrorItem{
		ID:                   "err-" + uuid.New().String()[:8],
		UserID:               userID,
		QuestionType:         req.QuestionType,
		Prompt:               req.Prompt,
		UserAnswer:           req.UserAnswer,
		CorrectAnswer:        req.CorrectAnswer,
		Explanation:          req.Explanation,
		ConsecutiveSuccesses: 0,
		AttemptsCount:        1,
		Mastered:             false,
		CreatedAt:            time.Now(),
	}

	if err := s.storage.Study().SaveError(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to save error item: %w", err)
	}

	return item, nil
}

func (s *StudyService) RecallError(ctx context.Context, userID, errorID, answer string) (*models.RecallErrorResponse, error) {
	item, err := s.storage.Study().GetErrorByID(ctx, userID, errorID)
	if err != nil {
		return nil, errors.New("error item not found")
	}

	cleanAnswer := strings.ToLower(strings.TrimSpace(answer))
	cleanCorrect := strings.ToLower(strings.TrimSpace(item.CorrectAnswer))

	isCorrect := (cleanAnswer == cleanCorrect)
	now := time.Now()
	item.LastReviewedAt = &now
	item.AttemptsCount++

	if isCorrect {
		item.ConsecutiveSuccesses++
		if item.ConsecutiveSuccesses >= 2 {
			item.Mastered = true
			if err := s.storage.Study().SaveError(ctx, item); err != nil {
				return nil, err
			}
			return &models.RecallErrorResponse{
				Success:              true,
				ConsecutiveSuccesses: item.ConsecutiveSuccesses,
				Mastered:             true,
				CorrectAnswer:        item.CorrectAnswer,
				Explanation:          item.Explanation,
				Message:              "Отлично! Ошибка успешно усвоена (2 верных повторения подряд).",
			}, nil
		}

		item.Mastered = false
		if err := s.storage.Study().SaveError(ctx, item); err != nil {
			return nil, err
		}
		return &models.RecallErrorResponse{
			Success:              true,
			ConsecutiveSuccesses: item.ConsecutiveSuccesses,
			Mastered:             false,
			CorrectAnswer:        item.CorrectAnswer,
			Explanation:          item.Explanation,
			Message:              "Верно! Повторите задание в следующем раунде для окончательного закрепления (1 из 2).",
		}, nil
	}

	// Incorrect answer: reset consecutive successes to 0
	item.ConsecutiveSuccesses = 0
	item.Mastered = false
	if err := s.storage.Study().SaveError(ctx, item); err != nil {
		return nil, err
	}

	return &models.RecallErrorResponse{
		Success:              false,
		ConsecutiveSuccesses: 0,
		Mastered:             false,
		CorrectAnswer:        item.CorrectAnswer,
		Explanation:          item.Explanation,
		Message:              fmt.Sprintf("Неверно. Правильный ответ: %s", item.CorrectAnswer),
	}, nil
}

func (s *StudyService) DeleteError(ctx context.Context, userID, errorID string) error {
	return s.storage.Study().DeleteError(ctx, userID, errorID)
}

// --- Daily activity & server-owned streak ---

func (s *StudyService) GetStreak(ctx context.Context, userID string, utcOffsetMinutes int) (*models.UserStreak, error) {
	dates, err := s.storage.Study().GetActivityDates(ctx, userID, 365)
	if err != nil {
		return nil, fmt.Errorf("failed to load activity: %w", err)
	}
	if len(dates) == 0 {
		return &models.UserStreak{StreakDays: 0, LastActiveDate: ""}, nil
	}

	active := map[string]bool{}
	for _, date := range dates {
		active[date] = true
	}

	today := time.Now().UTC().Add(time.Duration(utcOffsetMinutes) * time.Minute)
	start := today
	if !active[today.Format("2006-01-02")] {
		yesterday := today.AddDate(0, 0, -1)
		if !active[yesterday.Format("2006-01-02")] {
			return &models.UserStreak{StreakDays: 0, LastActiveDate: dates[0]}, nil
		}
		start = yesterday
	}

	streak := 0
	for day := start; active[day.Format("2006-01-02")]; day = day.AddDate(0, 0, -1) {
		streak++
	}
	return &models.UserStreak{StreakDays: streak, LastActiveDate: dates[0]}, nil
}

func (s *StudyService) RecordActivity(ctx context.Context, userID, source string, utcOffsetMinutes int) (*models.UserStreak, error) {
	if strings.TrimSpace(source) == "" {
		source = "app"
	}
	if utcOffsetMinutes < -14*60 || utcOffsetMinutes > 14*60 {
		utcOffsetMinutes = 0
	}
	today := time.Now().UTC().Add(time.Duration(utcOffsetMinutes) * time.Minute).Format("2006-01-02")
	if err := s.storage.Study().RecordActivity(ctx, userID, today, source); err != nil {
		return nil, fmt.Errorf("failed to record activity: %w", err)
	}
	return s.GetStreak(ctx, userID, utcOffsetMinutes)
}

// --- Spaced Repetition (SRS) Engine ---

func (s *StudyService) GetSRSState(ctx context.Context, userID string) (*models.SRSStateResponse, error) {
	stats, err := s.storage.Study().GetSRSStats(ctx, userID)
	if err != nil || stats == nil {
		stats = &models.SRSStats{StreakDays: 0, LastStudiedDate: "", TotalReviewed: 0}
	}

	cards, err := s.storage.Study().GetSRSCards(ctx, userID)
	if err != nil || cards == nil {
		cards = make(map[string]models.SRSCardProgress)
	}

	todayStr := time.Now().Format("2006-01-02")
	overdueCount := 0
	dueTodayCount := 0
	totalLearned := 0

	for _, card := range cards {
		if card.DueDate < todayStr {
			overdueCount++
		} else if card.DueDate == todayStr {
			dueTodayCount++
		}
		if card.Repetitions >= 3 {
			totalLearned++
		}
	}

	return &models.SRSStateResponse{
		Stats:         *stats,
		Cards:         cards,
		OverdueCount:  overdueCount,
		DueTodayCount: dueTodayCount,
		TotalLearned:  totalLearned,
	}, nil
}

func (s *StudyService) ReviewSRSCard(ctx context.Context, userID string, req models.ReviewSRSCardRequest) (*models.ReviewSRSCardResponse, error) {
	if req.CardID == "" {
		return nil, errors.New("cardId is required")
	}
	if req.Quality < 1 || req.Quality > 5 {
		req.Quality = 4 // Default Good
	}

	// Fetch existing cards
	cards, _ := s.storage.Study().GetSRSCards(ctx, userID)
	existing, exists := cards[req.CardID]

	intervalDays := 1
	repetitions := 0
	easinessFactor := 2.5

	if exists {
		intervalDays = existing.IntervalDays
		repetitions = existing.Repetitions
		easinessFactor = existing.EasinessFactor
	}

	// SuperMemo SM-2 Algorithm
	if req.Quality < 3 {
		repetitions = 0
		intervalDays = 1
	} else {
		if repetitions == 0 {
			intervalDays = 1
		} else if repetitions == 1 {
			intervalDays = 6
		} else {
			intervalDays = int(math.Round(float64(intervalDays) * easinessFactor))
			if intervalDays < 1 {
				intervalDays = 1
			}
		}
		repetitions++
	}

	// Update EF
	qDiff := float64(5 - req.Quality)
	easinessFactor = easinessFactor + (0.1 - qDiff*(0.08+qDiff*0.02))
	if easinessFactor < 1.3 {
		easinessFactor = 1.3
	}

	nextDueDate := time.Now().AddDate(0, 0, intervalDays).Format("2006-01-02")

	// Update streak honestly
	stats, _ := s.storage.Study().GetSRSStats(ctx, userID)
	if stats == nil {
		stats = &models.SRSStats{StreakDays: 0, LastStudiedDate: "", TotalReviewed: 0}
	}

	todayStr := time.Now().Format("2006-01-02")
	yesterdayStr := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

	if stats.LastStudiedDate == todayStr {
		// Studied today already, preserve streak
		if stats.StreakDays == 0 {
			stats.StreakDays = 1
		}
	} else if stats.LastStudiedDate == yesterdayStr {
		// Consecutive day!
		stats.StreakDays++
	} else {
		// New or broken streak
		stats.StreakDays = 1
	}

	stats.LastStudiedDate = todayStr
	stats.TotalReviewed++

	// Save card progress
	cardProgress := &models.SRSCardProgress{
		CardID:         req.CardID,
		IntervalDays:   intervalDays,
		Repetitions:    repetitions,
		EasinessFactor: easinessFactor,
		DueDate:        nextDueDate,
		LastReviewedAt: time.Now(),
	}

	if err := s.storage.Study().SaveSRSCard(ctx, userID, cardProgress); err != nil {
		return nil, fmt.Errorf("failed to save card progress: %w", err)
	}

	if err := s.storage.Study().SaveSRSStats(ctx, userID, stats); err != nil {
		return nil, fmt.Errorf("failed to save srs stats: %w", err)
	}

	return &models.ReviewSRSCardResponse{
		CardID:         req.CardID,
		IntervalDays:   intervalDays,
		Repetitions:    repetitions,
		EasinessFactor: easinessFactor,
		DueDate:        nextDueDate,
		StreakDays:     stats.StreakDays,
		TotalReviewed:  stats.TotalReviewed,
	}, nil
}

// --- Skill Analytics & 4 Modalities Breakdown ---

func (s *StudyService) GetSkillAnalytics(ctx context.Context, userID string) (*models.SkillAnalyticsResponse, error) {
	sessions, err := s.catService.GetUserSessions(ctx, userID)
	if err != nil {
		return nil, err
	}

	var completed []models.TestSession
	for _, sess := range sessions {
		if sess.Status == "COMPLETED" && intVal(sess.OverallScore) > 0 {
			completed = append(completed, sess)
		}
	}

	if len(completed) == 0 {
		return &models.SkillAnalyticsResponse{
			HasData:         false,
			LatestOverall:   0,
			BestOverall:     0,
			Modalities:      make(map[string]models.ModalityScore),
			Subscores:       models.IntegratedSubscores{},
			WeakestSkill:    "Нет данных",
			Recommendations: []string{"Пройдите полный контрольный тест (13 типов заданий) для расчета точных сабскоров."},
			History:         []models.SkillAttemptHistory{},
		}, nil
	}

	// Sort chronologically ascending for history
	sort.Slice(completed, func(i, j int) bool {
		return completed[i].CreatedAt.Before(completed[j].CreatedAt)
	})

	var history []models.SkillAttemptHistory
	bestOverall := 0
	for _, sess := range completed {
		score := intVal(sess.OverallScore)
		if score > bestOverall {
			bestOverall = score
		}
		history = append(history, models.SkillAttemptHistory{
			SessionID: sess.ID,
			Date:      timeVal(sess.CompletedAt).Format("02.01.2006"),
			Overall:   score,
			Modalities: map[string]int{
				"reading":   intVal(sess.ReadingScore),
				"listening": intVal(sess.ListeningScore),
				"writing":   intVal(sess.WritingScore),
				"speaking":  intVal(sess.SpeakingScore),
			},
			Subscores: models.IntegratedSubscores{
				Literacy:      intVal(sess.LiteracyScore),
				Comprehension: intVal(sess.ComprehensionScore),
				Production:    intVal(sess.ProductionScore),
				Conversation:  intVal(sess.ConversationScore),
			},
		})
	}

	// Latest session is the last in chronological order
	latest := completed[len(completed)-1]

	calcCEFR := func(score int) string {
		if score >= 135 {
			return "C1/C2"
		} else if score >= 115 {
			return "B2"
		} else if score >= 85 {
			return "B1"
		} else if score >= 55 {
			return "A2"
		}
		return "A1"
	}

	modalities := map[string]models.ModalityScore{
		"reading": {
			Score:          intVal(latest.ReadingScore),
			CEFR:           calcCEFR(intVal(latest.ReadingScore)),
			QuestionsCount: 4,
			Status:         "VERIFIED",
		},
		"listening": {
			Score:          intVal(latest.ListeningScore),
			CEFR:           calcCEFR(intVal(latest.ListeningScore)),
			QuestionsCount: 3,
			Status:         "VERIFIED",
		},
		"writing": {
			Score:          intVal(latest.WritingScore),
			CEFR:           calcCEFR(intVal(latest.WritingScore)),
			QuestionsCount: 3,
			Status:         "VERIFIED",
		},
		"speaking": {
			Score:          intVal(latest.SpeakingScore),
			CEFR:           calcCEFR(intVal(latest.SpeakingScore)),
			QuestionsCount: 4,
			Status:         "VERIFIED",
		},
	}

	// Identify weakest modality
	weakest := "speaking"
	lowestScore := intVal(latest.SpeakingScore)
	if intVal(latest.WritingScore) < lowestScore {
		lowestScore = intVal(latest.WritingScore)
		weakest = "writing"
	}
	if intVal(latest.ReadingScore) < lowestScore {
		lowestScore = intVal(latest.ReadingScore)
		weakest = "reading"
	}
	if intVal(latest.ListeningScore) < lowestScore {
		lowestScore = intVal(latest.ListeningScore)
		weakest = "listening"
	}

	var recs []string
	switch weakest {
	case "speaking":
		recs = append(recs,
			"Ваш устный блок (Speaking) является главным фактором ограничения общего балла.",
			"Ежедневно тренируйте темп речи: стремитесь к 100-130 WPM в Speak About Photo и Interactive Speaking.",
			"Используйте вводные фразы и слова-связки ('Furthermore', 'Consequently', 'In particular').",
		)
	case "writing":
		recs = append(recs,
			"Секция Writing требует увеличения объема и академической лексики.",
			"В Writing Sample пишите не менее 100-120 слов за 5 минут, развивая 2-3 логических аргумента.",
			"Обогащайте текст терминами из Academic Word List (AWL).",
		)
	case "reading":
		recs = append(recs,
			"В блоке Reading обратите внимание на точность восстановления приставок и суффиксов в C-Test.",
			"Повторите грамматические структуры сложных придаточных предложений в интерактивном чтении.",
		)
	case "listening":
		recs = append(recs,
			"В блоке Listening тренируйте орфографию под диктовку (Listen & Type).",
			"Потренируйтесь удерживать в памяти контекст диалога в Interactive Listening.",
		)
	}

	return &models.SkillAnalyticsResponse{
		HasData:       true,
		LatestOverall: intVal(latest.OverallScore),
		BestOverall:   bestOverall,
		Modalities:    modalities,
		Subscores: models.IntegratedSubscores{
			Literacy:      intVal(latest.LiteracyScore),
			Comprehension: intVal(latest.ComprehensionScore),
			Production:    intVal(latest.ProductionScore),
			Conversation:  intVal(latest.ConversationScore),
		},
		WeakestSkill:    weakest,
		Recommendations: recs,
		History:         history,
	}, nil
}

func (s *StudyService) CompletePlanTask(ctx context.Context, userID, taskID string) error {
	allowed := map[string]bool{
		"task-srs": true, "task-errors": true, "task-drill": true,
		"task-theory": true, "task-mock": true,
	}
	if !allowed[taskID] {
		return errors.New("unknown plan task")
	}
	today := time.Now().UTC().Format("2006-01-02")
	return s.storage.Study().CompletePlanTask(ctx, userID, taskID, today, "manual")
}

func (s *StudyService) GetWeeklyReport(ctx context.Context, userID string) (*models.WeeklyReport, error) {
	now := time.Now().UTC()
	weekStart := now.AddDate(0, 0, -6)
	report := &models.WeeklyReport{
		WeekStart:       weekStart.Format("2006-01-02"),
		WeekEnd:         now.Format("2006-01-02"),
		Recommendations: []string{},
	}

	dates, _ := s.storage.Study().GetActivityDates(ctx, userID, 7)
	for _, date := range dates {
		parsed, err := time.Parse("2006-01-02", date)
		if err == nil && !parsed.Before(weekStart) {
			report.StudyDays++
		}
	}

	sessions, _ := s.catService.GetUserSessions(ctx, userID)
	for _, session := range sessions {
		if session.CompletedAt == nil || session.CompletedAt.Before(weekStart) {
			continue
		}
		report.Sessions++
		if session.OverallScore != nil && *session.OverallScore > 0 {
			report.MockTests++
			report.CurrentEstimate = *session.OverallScore
		}
	}
	if report.CurrentEstimate > 0 {
		report.RangeLow = int(math.Max(10, float64(report.CurrentEstimate-10)))
		report.RangeHigh = int(math.Min(160, float64(report.CurrentEstimate+10)))
	}

	errorsList, _ := s.storage.Study().GetErrors(ctx, userID)
	for _, item := range errorsList {
		if item.CreatedAt.After(weekStart) {
			report.ErrorsAdded++
		}
		if item.Mastered && item.LastReviewedAt != nil && item.LastReviewedAt.After(weekStart) {
			report.ErrorsMastered++
		}
	}

	cards, _ := s.storage.Study().GetSRSCards(ctx, userID)
	for _, card := range cards {
		if !card.LastReviewedAt.IsZero() && card.LastReviewedAt.After(weekStart) {
			report.SRSReviews++
		}
	}

	if report.CurrentEstimate > 0 {
		// Weakest skill from the most recent completed session.
		for _, session := range sessions {
			if session.CompletedAt == nil || session.CompletedAt.Before(weekStart) || session.OverallScore == nil {
				continue
			}
			type skill struct {
				name  string
				value int
			}
			skills := []skill{
				{"Speaking", intVal(session.SpeakingScore)},
				{"Writing", intVal(session.WritingScore)},
				{"Reading", intVal(session.ReadingScore)},
				{"Listening", intVal(session.ListeningScore)},
			}
			lowest := 161
			for _, item := range skills {
				if item.value > 0 && item.value < lowest {
					lowest = item.value
					report.WeakestSkill = item.name
				}
			}
			break
		}
	}

	if report.WeakestSkill != "" {
		report.Recommendations = append(report.Recommendations,
			"Следующая неделя: 2 короткие сессии на "+report.WeakestSkill+" и один полный mock.")
	}
	if report.ErrorsAdded > report.ErrorsMastered {
		report.Recommendations = append(report.Recommendations,
			"В тетради ошибок больше новых записей, чем освоенных. Закройте 5 повторений в SRS.")
	}
	if report.StudyDays < 3 {
		report.Recommendations = append(report.Recommendations,
			"Регулярность важнее длины сессии: запланируйте 3 занятия по 15–20 минут.")
	}
	if len(report.Recommendations) == 0 {
		report.Recommendations = append(report.Recommendations,
			"Продолжайте текущий план и пройдите контрольный mock в конце недели.")
	}

	return report, nil
}
