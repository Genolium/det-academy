package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"encoding/json"
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

func emitLearningEvent(ctx context.Context, repo repository.StudyRepository, userID, eventType, key string, payload any) {
	if repo == nil || userID == "" || key == "" {
		return
	}
	raw, err := json.Marshal(payload)
	if err != nil || len(raw) == 0 {
		raw = []byte(`{}`)
	}
	_, _ = repo.RecordLearningEvent(ctx, &models.LearningEvent{
		ID:             uuid.NewString(),
		UserID:         userID,
		EventType:      eventType,
		Payload:        raw,
		IdempotencyKey: key,
		CreatedAt:      time.Now().UTC(),
	})
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

// ErrGoalsNotConfigured means the student has not chosen a target yet. The
// service never invents a target score, a deadline or a university for them.
var ErrGoalsNotConfigured = errors.New("study goals are not configured")

func (s *StudyService) GetGoals(ctx context.Context, userID string) (*models.UserGoal, error) {
	goal, err := s.storage.Study().GetGoals(ctx, userID)
	if err != nil {
		return nil, err
	}
	if goal == nil {
		return nil, ErrGoalsNotConfigured
	}
	return goal, nil
}

func (s *StudyService) UpdateGoals(ctx context.Context, userID string, req models.UpdateGoalsRequest) (*models.UserGoal, error) {
	if req.TargetScore < 60 || req.TargetScore > 160 {
		return nil, errors.New("targetScore must be between 60 and 160")
	}
	if req.DailyMinutes < 15 || req.DailyMinutes > 240 {
		return nil, errors.New("dailyMinutes must be between 15 and 240")
	}
	if req.TargetDate == "" {
		return nil, errors.New("targetDate is required")
	}
	if _, err := time.Parse("2006-01-02", req.TargetDate); err != nil {
		return nil, errors.New("targetDate must use the YYYY-MM-DD format")
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
	// A single attempt is not evidence. Readiness is only reported once there
	// are at least two completed mock tests.
	readinessAvailable := len(completedSessions) >= 2
	readinessPercent := 0
	readinessBasis := fmt.Sprintf(
		"Недостаточно данных: нужен минимум 2 завершённых mock-теста (сейчас %d).",
		len(completedSessions),
	)
	if readinessAvailable {
		// Evaluate 4 modalities completeness and consistency across recent mock sessions
		recentSessions := completedSessions
		if len(recentSessions) > 3 {
			recentSessions = recentSessions[:3]
		}

		// 1. Modality completeness: do all 4 skills have measured scores in the latest session?
		latest := recentSessions[0]
		measuredCount := 0
		if intVal(latest.ReadingScore) > 0 {
			measuredCount++
		}
		if intVal(latest.ListeningScore) > 0 {
			measuredCount++
		}
		if intVal(latest.WritingScore) > 0 {
			measuredCount++
		}
		if intVal(latest.SpeakingScore) > 0 {
			measuredCount++
		}
		completenessRatio := float64(measuredCount) / 4.0

		// 2. Stability score: measure standard deviation of overall scores across recent tests
		stabilityFactor := 1.0
		if len(recentSessions) >= 2 {
			diff := math.Abs(float64(intVal(recentSessions[0].OverallScore) - intVal(recentSessions[1].OverallScore)))
			// If variance between attempts is very large (> 25 pts), reduce readiness confidence
			if diff > 25 {
				stabilityFactor = 0.85
			} else if diff <= 10 {
				stabilityFactor = 1.0
			} else {
				stabilityFactor = 0.95
			}
		}

		// Combined formula: 30% theory + 50% target ratio + 20% modality completeness * stability
		rawReadiness := (theoryPct*30.0 + mockRatio*50.0 + completenessRatio*20.0) * stabilityFactor
		readinessPercent = int(math.Round(math.Max(0, math.Min(100, rawReadiness))))

		readinessBasis = fmt.Sprintf(
			"Многофакторный расчёт: %d завершённых mock-тестов (теория %d%%, модальности %d/4, ориентир %d из %d, стабильность %.0f%%).",
			len(completedSessions), int(math.Round(theoryPct*100)), measuredCount, currentEstimate, goal.TargetScore, stabilityFactor*100,
		)
	}

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
			ID:               "task-srs",
			Type:             "srs",
			Title:            "Интервальное повторение AWL",
			Description:      fmt.Sprintf("К повторению сегодня: %d карточек академической лексики по алгоритму SuperMemo SM-2", totalDue),
			ActionURL:        "/practice/flashcards",
			Count:            totalDue,
			Priority:         "HIGH",
			EstimatedMinutes: 5 + minInt(totalDue/10, 10),
			Reason:           fmt.Sprintf("Пора повторить %d карточек: интервал SRS подошёл к концу.", totalDue),
			Completed:        false,
		})
	} else {
		tasks = append(tasks, models.DailyTask{
			ID:               "task-srs",
			Type:             "srs",
			Title:            "Изучение новых слов AWL",
			Description:      "Все карточки на сегодня повторены! Изучите 10 новых терминов C1/C2",
			ActionURL:        "/practice/flashcards",
			Count:            10,
			Priority:         "MEDIUM",
			EstimatedMinutes: 10,
			Reason:           "Все карточки на сегодня повторены — добавьте новые термины, чтобы поддерживать словарный запас.",
			Completed:        true,
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
			ID:               "task-errors",
			Type:             "error_recall",
			Title:            "Тетрадь ошибок: повторная отработка",
			Description:      fmt.Sprintf("%d сложных заданий ждут решения (требуется 2 верных ответа подряд для усвоения)", unmasteredCount),
			ActionURL:        "/dashboard#errors",
			Count:            unmasteredCount,
			Priority:         "HIGH",
			EstimatedMinutes: 3 + minInt(unmasteredCount, 12),
			Reason:           fmt.Sprintf("%d ошибок ещё не закреплены двумя верными повторами.", unmasteredCount),
			Completed:        false,
		})
	}

	// Task 3: Targeted Weakest Skill Drill
	if strings.Contains(weakestSkill, "Speaking") {
		tasks = append(tasks, models.DailyTask{
			ID:               "task-drill",
			Type:             "practice_drill",
			Title:            "Интенсив: Устная речь (Speaking)",
			Description:      "Отработайте упражнения Interactive Speaking и Speak About Photo для роста беглости (WPM) и диверсификации лексики",
			ActionURL:        "/practice",
			Priority:         "HIGH",
			EstimatedMinutes: 15,
			Reason:           "Speaking — самый слабый навык по последнему mock-тесту.",
			Completed:        false,
		})
	} else if strings.Contains(weakestSkill, "Writing") {
		tasks = append(tasks, models.DailyTask{
			ID:               "task-drill",
			Type:             "practice_drill",
			Title:            "Интенсив: Академическое письмо (Writing)",
			Description:      "Напишите развернутый Writing Sample с использованием академических коннекторов и академического вокабуляра",
			ActionURL:        "/practice",
			Priority:         "HIGH",
			EstimatedMinutes: 15,
			Reason:           "Writing — самый слабый навык по последнему mock-тесту.",
			Completed:        false,
		})
	} else if strings.Contains(weakestSkill, "Reading") {
		tasks = append(tasks, models.DailyTask{
			ID:               "task-drill",
			Type:             "practice_drill",
			Title:            "Интенсив: Чтение и C-Test (Reading)",
			Description:      "Пройдите тренировку Read and Complete для автоматизма восстановления морфем в академическом контексте",
			ActionURL:        "/practice",
			Priority:         "MEDIUM",
			EstimatedMinutes: 15,
			Reason:           "Reading — самый слабый навык по последнему mock-тесту.",
			Completed:        false,
		})
	} else {
		tasks = append(tasks, models.DailyTask{
			ID:               "task-drill",
			Type:             "practice_drill",
			Title:            "Адаптивный контрольный тест DET",
			Description:      "Пройдите симулятор тестирования (13 типов заданий) для калибровки текущей готовности",
			ActionURL:        "/test",
			Priority:         "MEDIUM",
			EstimatedMinutes: 30,
			Reason:           "Пока нет завершённого mock-теста — полный прогон даст ориентир и выявит слабый навык.",
			Completed:        false,
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
			ID:               "task-theory",
			Type:             "theory",
			Title:            fmt.Sprintf("Урок теории: %s", nextLessonSlug),
			Description:      "Изучите формат, официальные рубрики оценки и типичные ловушки прокторов",
			ActionURL:        fmt.Sprintf("/theory/%s", nextLessonSlug),
			Priority:         "MEDIUM",
			EstimatedMinutes: 10,
			Reason:           "Следующий непройденный урок программы.",
			Completed:        false,
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

	tasks = fitTasksToBudget(tasks, goal.DailyMinutes)

	today := time.Now().UTC().Format("2006-01-02")
	completions, _ := s.storage.Study().GetPlanTaskCompletions(ctx, userID, today)
	for index := range tasks {
		if completedAt, ok := completions[tasks[index].ID]; ok {
			tasks[index].Completed = true
			tasks[index].CompletedAt = completedAt.Format(time.RFC3339)
		}
	}

	return &models.StudyPlanResponse{
		Configured:         true,
		TargetScore:        goal.TargetScore,
		TargetDate:         goal.TargetDate,
		DaysRemaining:      daysRemaining,
		DailyMinutes:       goal.DailyMinutes,
		CurrentEstimate:    currentEstimate,
		WeakestSkill:       weakestSkill,
		WeeklyHoursNeeded:  weeklyHours,
		ReadinessAvailable: readinessAvailable,
		ReadinessPercent:   readinessPercent,
		ReadinessBasis:     readinessBasis,
		StatusMessage:      statusMsg,
		TasksToday:         tasks,
	}, nil
}

// --- Server-side XP ledger and leagues ---

// leagueThresholds are ordered from the highest league to Bronze. The league
// is fully reproducible from the ledger: weekly XP is the only input.
var leagueThresholds = []struct {
	Name string
	Min  int
}{
	{"Diamond", 1500},
	{"Platinum", 700},
	{"Gold", 300},
	{"Silver", 100},
	{"Bronze", 0},
}

// AwardXP records a reward once per idempotency key.
func (s *StudyService) AwardXP(ctx context.Context, userID, eventType, idempotencyKey string, xp int) (bool, error) {
	if strings.TrimSpace(idempotencyKey) == "" {
		return false, errors.New("idempotency key is required")
	}
	if xp <= 0 {
		return false, errors.New("xp must be positive")
	}
	event := &models.XPEvent{
		ID:             uuid.NewString(),
		UserID:         userID,
		EventType:      eventType,
		IdempotencyKey: idempotencyKey,
		XP:             xp,
		Metadata:       []byte(`{}`),
		CreatedAt:      time.Now().UTC(),
	}
	return s.storage.Study().AwardXP(ctx, event)
}

// GetXPProfile builds the retention view from the ledger.
func (s *StudyService) GetXPProfile(ctx context.Context, userID string) (*models.XPProfile, error) {
	total, err := s.storage.Study().XPTotal(ctx, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	weekStart := now.AddDate(0, 0, -((int(now.Weekday()) + 6) % 7))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, time.UTC)

	weekly, err := s.storage.Study().XPBetween(ctx, userID, weekStart, now.Add(time.Minute))
	if err != nil {
		return nil, err
	}

	profile := &models.XPProfile{
		Total:     total,
		Weekly:    weekly,
		WeekStart: weekStart.Format("2006-01-02"),
		History:   []models.XPEvent{},
	}
	for _, league := range leagueThresholds {
		if weekly >= league.Min {
			profile.League = league.Name
			break
		}
	}
	if profile.League == "" {
		profile.League = "Bronze"
	}
	for index := len(leagueThresholds) - 1; index >= 0; index-- {
		league := leagueThresholds[index]
		if league.Min > weekly {
			profile.NextLeague = league.Name
			profile.NextAt = league.Min
			break
		}
	}

	profile.LeagueBasis = fmt.Sprintf(
		"Лига считается по XP за текущую неделю (с понедельника 00:00 UTC, начало %s). Повторное событие с тем же ключом награду не начисляет.",
		weekStart.Format("2006-01-02"),
	)

	if history, err := s.storage.Study().XPHistory(ctx, userID, 20); err == nil {
		profile.History = history
	}
	return profile, nil
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

	category := req.ErrorCategory
	if category == "" {
		category = DeduceErrorCategory(req.QuestionType, req.Explanation)
	}
	rule := req.ErrorRule
	if rule == "" {
		rule = DeduceErrorRule(category, req.Explanation)
	}
	variants := req.ContextVariants
	if len(variants) == 0 {
		variants = GenerateContextVariants(category, req.Prompt, req.CorrectAnswer, rule)
	}

	item := &models.UserErrorItem{
		ID:                   "err-" + uuid.New().String()[:8],
		UserID:               userID,
		QuestionType:         req.QuestionType,
		Prompt:               req.Prompt,
		UserAnswer:           req.UserAnswer,
		CorrectAnswer:        req.CorrectAnswer,
		Explanation:          req.Explanation,
		ErrorCategory:        category,
		ErrorRule:            rule,
		ContextVariants:      variants,
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

	_ = s.storage.Study().RecordActivity(ctx, userID, todayStr, "srs")
	_ = s.CompletePlanTaskWithSource(ctx, userID, "task-srs", todayStr, "srs_review")
	_, _ = s.AwardXP(ctx, userID, "srs", "srs:"+req.CardID+":"+todayStr, 5)
	emitLearningEvent(ctx, s.storage.Study(), userID, "srs_reviewed", "srs:"+req.CardID+":"+todayStr, map[string]any{
		"cardId": req.CardID,
	})

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
	return s.CompletePlanTaskWithSource(ctx, userID, taskID, today, "manual")
}

func (s *StudyService) CompletePlanTaskWithSource(ctx context.Context, userID, taskID, today, source string) error {
	if err := s.storage.Study().CompletePlanTask(ctx, userID, taskID, today, source); err != nil {
		return err
	}
	// Plan-task completion is a bookkeeping flag. XP comes only from domain
	// events (practice, SRS, lesson, mock) so a checkbox cannot farm the league.
	return nil
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

// coachTypes are the productive skills that have a coaching view.
var coachTypes = map[string]bool{
	"WRITE_PHOTO":          true,
	"INTERACTIVE_WRITING":  true,
	"WRITING_SAMPLE":       true,
	"SPEAK_PHOTO":          true,
	"READ_THEN_SPEAK":      true,
	"INTERACTIVE_SPEAKING": true,
	"SPEAKING_SAMPLE":      true,
}

// BuildCoachReport compares the speaking/writing answers of an attempt with
// the student's previous attempt at the same task type. Provider failures are
// reported as unavailable instead of being turned into a zero skill.
func (s *StudyService) BuildCoachReport(ctx context.Context, sessionID, userID string) (*models.CoachReport, error) {
	session, err := s.catService.GetSession(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, errors.New("session not found")
	}

	evaluations, err := s.catService.GetSessionEvaluations(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}

	// Previous evaluations of the same task type from the student's other
	// sessions, newest first.
	previous := make(map[string]*models.EvaluationResult)
	if sessions, err := s.catService.GetUserSessions(ctx, userID); err == nil {
		for _, other := range sessions {
			if other.ID == sessionID {
				continue
			}
			if other.CompletedAt == nil {
				continue
			}
			items, evalErr := s.catService.GetSessionEvaluations(ctx, other.ID, userID)
			if evalErr != nil {
				continue
			}
			for index := range items {
				item := items[index]
				if !coachTypes[item.QuestionType] || item.Status != "COMPLETED" {
					continue
				}
				if _, exists := previous[item.QuestionType]; !exists {
					previous[item.QuestionType] = &item
				}
			}
		}
	}

	report := &models.CoachReport{SessionID: sessionID, Items: []models.CoachItem{}}
	failed := 0

	for _, evaluation := range evaluations {
		if !coachTypes[evaluation.QuestionType] {
			continue
		}
		if evaluation.Status != "COMPLETED" {
			failed++
			report.Items = append(report.Items, models.CoachItem{
				QuestionID:   evaluation.QuestionID,
				QuestionType: evaluation.QuestionType,
				Status:       evaluation.Status,
				Provider:     evaluation.Provider,
				PracticeURL:  coachPracticeURL(evaluation.QuestionType),
			})
			continue
		}

		item := models.CoachItem{
			QuestionID:       evaluation.QuestionID,
			QuestionType:     evaluation.QuestionType,
			Status:           evaluation.Status,
			Score:            evaluation.Score,
			CEFRLevel:        evaluation.CEFRLevel,
			Provider:         evaluation.Provider,
			EvaluatorVersion: evaluation.EvaluatorVersion,
			Feedback:         evaluation.Feedback,
			TranscriptSource: evaluation.TranscriptSource,
			Recommendations:  evaluation.Recommendations,
			PracticeURL:      coachPracticeURL(evaluation.QuestionType),
		}
		for _, span := range evaluation.EvidenceSpans {
			item.Evidence = append(item.Evidence, models.CoachEvidence{
				Span: span.Text,
				Rule: span.Label,
				Fix:  span.Suggestion,
			})
		}

		if prior, ok := previous[evaluation.QuestionType]; ok {
			previousScore := prior.Score
			delta := evaluation.Score - prior.Score
			item.PreviousScore = &previousScore
			item.ScoreDelta = &delta
			if delta > 0.001 {
				item.Improvements = append(item.Improvements, fmt.Sprintf(
					"Оценка выросла на %.2f по сравнению с прошлой попыткой (%.2f → %.2f).",
					delta, prior.Score, evaluation.Score,
				))
			} else if delta < -0.001 {
				item.Improvements = append(item.Improvements, fmt.Sprintf(
					"Оценка снизилась на %.2f по сравнению с прошлой попыткой (%.2f → %.2f).",
					-delta, prior.Score, evaluation.Score,
				))
			} else {
				item.Improvements = append(item.Improvements, "Оценка не изменилась относительно прошлой попытки.")
			}
			if evaluation.CEFRLevel != "" && prior.CEFRLevel != "" && evaluation.CEFRLevel != prior.CEFRLevel {
				item.Improvements = append(item.Improvements, fmt.Sprintf(
					"Уровень CEFR: %s → %s.", prior.CEFRLevel, evaluation.CEFRLevel,
				))
			}
			if prior.UniqueWords > 0 {
				if diff := evaluation.UniqueWords - prior.UniqueWords; diff != 0 {
					item.Improvements = append(item.Improvements, fmt.Sprintf(
						"Уникальных слов: %+d (было %d, стало %d).", diff, prior.UniqueWords, evaluation.UniqueWords,
					))
				}
			}
		} else {
			item.Improvements = append(item.Improvements, "Это первая попытка по этому типу задания — сравнение появится после следующей.")
		}

		report.Items = append(report.Items, item)
	}

	report.Available = len(report.Items) > 0
	if !report.Available {
		report.Notice = "В этой попытке нет ответов Speaking или Writing."
	} else if failed == len(report.Items) {
		report.Notice = "Оценка недоступна: провайдер оценивания не ответил. Это не нулевой навык — попробуйте переоценить ответ позже."
	}

	return report, nil
}

// SaveCoachErrors turns the weakest coaching observations into repeatable
// Error Notebook entries. It is idempotent: identical active errors are not
// duplicated by SaveError.
func (s *StudyService) SaveCoachErrors(ctx context.Context, sessionID, userID string) (int, error) {
	report, err := s.BuildCoachReport(ctx, sessionID, userID)
	if err != nil {
		return 0, err
	}

	created := 0
	for _, item := range report.Items {
		if item.Status != "COMPLETED" {
			continue
		}
		if len(item.Evidence) == 0 && len(item.Recommendations) == 0 {
			continue
		}

		prompt := fmt.Sprintf("%s: %s", item.QuestionType, coachTaskTitle(item.QuestionType))
		correct := ""
		explanation := ""
		if len(item.Evidence) > 0 {
			correct = item.Evidence[0].Fix
			explanation = fmt.Sprintf("Наблюдение: %s. Правило: %s.", item.Evidence[0].Span, item.Evidence[0].Rule)
		}
		if correct == "" && len(item.Recommendations) > 0 {
			correct = item.Recommendations[0]
		}
		if correct == "" {
			correct = item.Feedback
		}
		if strings.TrimSpace(correct) == "" {
			continue
		}

		_, saveErr := s.SaveError(ctx, userID, models.SaveErrorRequest{
			QuestionType:  item.QuestionType,
			Prompt:        prompt,
			UserAnswer:    item.Feedback,
			CorrectAnswer: correct,
			Explanation:   explanation,
		})
		if saveErr != nil {
			continue
		}
		created++
	}

	return created, nil
}

func coachPracticeURL(questionType string) string {
	switch questionType {
	case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE":
		return "/practice"
	case "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
		return "/practice"
	default:
		return "/practice"
	}
}

func coachTaskTitle(questionType string) string {
	switch questionType {
	case "WRITE_PHOTO":
		return "Write about the photo"
	case "INTERACTIVE_WRITING":
		return "Interactive writing"
	case "WRITING_SAMPLE":
		return "Writing sample"
	case "SPEAK_PHOTO":
		return "Speak about the photo"
	case "READ_THEN_SPEAK":
		return "Read then speak"
	case "INTERACTIVE_SPEAKING":
		return "Interactive speaking"
	case "SPEAKING_SAMPLE":
		return "Speaking sample"
	default:
		return questionType
	}
}

// minInt returns the smaller of two integers.
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// fitTasksToBudget keeps only the tasks that fit into the time the student has
// available today. The highest-priority tasks win; if even the shortest task
// does not fit, the plan stays empty instead of pretending the time is enough.
func fitTasksToBudget(tasks []models.DailyTask, budgetMinutes int) []models.DailyTask {
	if len(tasks) == 0 {
		return tasks
	}
	if budgetMinutes <= 0 {
		return tasks
	}
	kept := make([]models.DailyTask, 0, len(tasks))
	used := 0
	for _, task := range tasks {
		minutes := task.EstimatedMinutes
		if minutes <= 0 {
			minutes = 10
		}
		if used+minutes > budgetMinutes {
			continue
		}
		kept = append(kept, task)
		used += minutes
	}
	return kept
}

// CreatePracticeAssignment issues a clean, server-side practice assignment without revealing correct answers.
func (s *StudyService) CreatePracticeAssignment(ctx context.Context, userID, questionType string) (*models.PracticeAssignment, error) {
	if questionType == "" {
		return nil, errors.New("questionType is required")
	}
	if isSpeakingType(questionType) {
		if err := checkSpeakingDailyLimit(ctx, s.storage.Study(), userID); err != nil {
			return nil, err
		}
	}

	questions, err := s.storage.Questions().ListByTypeAndDifficulty(ctx, questionType, "")
	if err != nil || len(questions) == 0 {
		return nil, fmt.Errorf("no active questions found for type: %s", questionType)
	}

	selected := questions[0]
	if len(questions) > 1 && userID != "" {
		recent, _ := s.storage.Study().GetPracticeAttempts(ctx, userID, questionType, 1)
		if len(recent) > 0 {
			for _, q := range questions {
				if q.ID != recent[0].QuestionID {
					selected = q
					break
				}
			}
		}
	}

	sanitizedPayload := sanitizeContentPayload(selected.Type, selected.ContentPayload)
	asgn := &models.PracticeAssignment{
		AssignmentID:   "asgn-" + uuid.NewString()[:12],
		QuestionID:     selected.ID,
		QuestionType:   selected.Type,
		DifficultyBand: selected.DifficultyBand,
		ContentPayload: sanitizedPayload,
		TimeLimitSec:   selected.TimeLimitSec,
		CreatedAt:      time.Now().UTC(),
	}

	_ = s.storage.Study().CreatePracticeAssignment(ctx, asgn)
	return asgn, nil
}

// GetPracticeAssignment returns a previously issued practice assignment.
func (s *StudyService) GetPracticeAssignment(ctx context.Context, assignmentID string) (*models.PracticeAssignment, error) {
	if assignmentID == "" {
		return nil, errors.New("assignmentId is required")
	}
	return s.storage.Study().GetPracticeAssignment(ctx, assignmentID)
}

// RecordPracticeAttempt grades a drill on the server when a question ID is
// supplied. Client-reported isCorrect/score are ignored.
func (s *StudyService) RecordPracticeAttempt(ctx context.Context, userID, questionType, questionID, promptContext string, userResponse json.RawMessage, timeSpentSec int) (*models.PracticeAttempt, error) {
	if (questionID == "" || questionType == "") && strings.HasPrefix(promptContext, "asgn-") {
		if asgn, err := s.GetPracticeAssignment(ctx, promptContext); err == nil && asgn != nil {
			if questionID == "" {
				questionID = asgn.QuestionID
			}
			if questionType == "" {
				questionType = asgn.QuestionType
			}
		}
	}
	if questionType == "" {
		return nil, errors.New("questionType is required")
	}

	isCorrect := false
	score := 0.0
	serverGraded := false
	var correctAnswers json.RawMessage

	if questionID != "" && s.catService != nil {
		if q, err := s.catService.QuestionByID(ctx, questionID); err == nil && q != nil {
			correctAnswers = q.CorrectAnswers
			if closedCorrect, closedScore, handled := GradeClosedItem(q, userResponse); handled {
				isCorrect = closedCorrect
				score = closedScore
				serverGraded = true
			} else if isOpenEndedQuestionType(q.Type) {
				userText, transcript, _, durationSec := extractUserText(userResponse)
				var eval models.EvaluationResult
				if transcript != "" || durationSec > 0 {
					eval = NewEvaluator().EvaluateSpeaking("", questionID, q.Type, transcript, durationSec, extractContextKeywords(q.ContentPayload))
				} else {
					eval = NewEvaluator().EvaluateWriting("", questionID, q.Type, userText, extractContextKeywords(q.ContentPayload))
				}
				score = eval.Score
				isCorrect = eval.Score >= 0.6
				serverGraded = true
			}
			if q.Type != "" {
				questionType = q.Type
			}
		}
	}

	attemptID := uuid.NewString()
	attempt := &models.PracticeAttempt{
		ID:            attemptID,
		UserID:        userID,
		QuestionType:  questionType,
		QuestionID:    questionID,
		PromptContext: promptContext,
		UserResponse:  userResponse,
		IsCorrect:     isCorrect,
		Score:         score,
		TimeSpentSec:  timeSpentSec,
		CreatedAt:     time.Now().UTC(),
	}

	if err := s.storage.Study().RecordPracticeAttempt(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to record practice attempt: %w", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	_ = s.storage.Study().RecordActivity(ctx, userID, today, "practice")
	_ = s.CompletePlanTaskWithSource(ctx, userID, "task-drill", today, "practice_attempt")
	if serverGraded {
		skill := MapQuestionTypeToSkill(questionType)
		_ = s.storage.Study().UpdateSkillMastery(ctx, userID, skill, score)
		if isCorrect {
			_, _ = s.AwardXP(ctx, userID, "practice", "practice:"+attemptID, 15)
		} else {
			_, _ = s.AwardXP(ctx, userID, "practice", "practice:"+attemptID, 5)

			explanation := "Practice drill error"
			correctStr := "Check correct solution"
			if len(correctAnswers) > 0 {
				correctStr = string(correctAnswers)
			}
			_, _ = s.SaveError(ctx, userID, models.SaveErrorRequest{
				QuestionType:  questionType,
				Prompt:        promptContext,
				UserAnswer:    string(userResponse),
				CorrectAnswer: correctStr,
				Explanation:   explanation,
			})
		}
	}
	emitLearningEvent(ctx, s.storage.Study(), userID, "practice_submitted", "practice:"+attemptID, map[string]any{
		"questionType": questionType,
		"questionId":   questionID,
		"score":        score,
		"isCorrect":    isCorrect,
		"serverGraded": serverGraded,
	})

	return attempt, nil
}

// RecordTypingAttempt saves a student typing trainer test and updates best WPM.
func (s *StudyService) RecordTypingAttempt(ctx context.Context, userID string, wpm int, accuracy float64, mode string, durationSec int) (*models.TypingAttempt, error) {
	if wpm < 0 || wpm > 250 {
		return nil, errors.New("invalid wpm value")
	}
	if accuracy < 0 || accuracy > 100 {
		return nil, errors.New("invalid accuracy value")
	}
	if durationSec <= 0 {
		durationSec = 30
	}
	if mode == "" {
		mode = "time"
	}

	attemptID := uuid.NewString()
	attempt := &models.TypingAttempt{
		ID:          attemptID,
		UserID:      userID,
		WPM:         wpm,
		Accuracy:    accuracy,
		Mode:        mode,
		DurationSec: durationSec,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.storage.Study().RecordTypingAttempt(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to record typing attempt: %w", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	_ = s.storage.Study().RecordActivity(ctx, userID, today, "typing")

	// Award XP for typing: 10 XP if accuracy >= 70% and WPM >= 20
	if accuracy >= 70.0 && wpm >= 20 {
		_, _ = s.AwardXP(ctx, userID, "typing", "typing:"+attemptID, 10)
	}
	emitLearningEvent(ctx, s.storage.Study(), userID, "typing_submitted", "typing:"+attemptID, map[string]any{
		"wpm":      wpm,
		"accuracy": accuracy,
	})

	return attempt, nil
}

func (s *StudyService) GetTypingHistory(ctx context.Context, userID string) (int, []models.TypingAttempt, error) {
	bestWPM, err := s.storage.Study().GetBestTypingWPM(ctx, userID)
	if err != nil {
		return 0, nil, err
	}
	attempts, err := s.storage.Study().GetTypingAttempts(ctx, userID, 20)
	if err != nil {
		return 0, nil, err
	}
	return bestWPM, attempts, nil
}

func (s *StudyService) GetSkillMastery(ctx context.Context, userID string) (map[string]models.UserSkillMastery, error) {
	return s.storage.Study().GetSkillMastery(ctx, userID)
}

// DeduceErrorCategory classifies the error based on question type and explanation keywords.
func DeduceErrorCategory(questionType, explanation string) string {
	lowerExp := strings.ToLower(explanation)
	switch {
	case strings.Contains(lowerExp, "connector") || strings.Contains(lowerExp, "linking") || strings.Contains(lowerExp, "however") || strings.Contains(lowerExp, "therefore"):
		return "connector"
	case strings.Contains(lowerExp, "collocation") || strings.Contains(lowerExp, "preposition") || strings.Contains(lowerExp, "phrase"):
		return "collocation"
	case strings.Contains(lowerExp, "subject") || strings.Contains(lowerExp, "verb") || strings.Contains(lowerExp, "agreement") || strings.Contains(lowerExp, "plural") || strings.Contains(lowerExp, "tense"):
		return "grammar"
	case questionType == "FILL_BLANKS" || questionType == "C_TEST" || strings.Contains(lowerExp, "morpheme") || strings.Contains(lowerExp, "prefix") || strings.Contains(lowerExp, "suffix"):
		return "morpheme"
	case questionType == "READ_SELECT" || questionType == "LISTEN_SELECT":
		return "vocabulary"
	default:
		return "general"
	}
}

// DeduceErrorRule provides an academic rule hint based on category and explanation.
func DeduceErrorRule(category, explanation string) string {
	switch category {
	case "morpheme":
		return "Word Formation: Check grammatical part of speech and affix spelling."
	case "connector":
		return "Discourse Markers: Select cohesive devices reflecting contrasting or causal relations."
	case "collocation":
		return "Academic Collocations: Pair words following standard academic English usage."
	case "grammar":
		return "Subject-Verb Concord: Ensure agreement in number, person, and tense continuity."
	case "vocabulary":
		return "Lexical Authenticity: Differentiate genuine C1/C2 terms from pseudo-words."
	default:
		if explanation != "" {
			return explanation
		}
		return "General Accuracy: Review context and verify intended meaning."
	}
}

// GenerateContextVariants creates alternate practice sentences for deep retention.
func GenerateContextVariants(category, prompt, correctAnswer, rule string) []models.ContextVariant {
	var variants []models.ContextVariant
	cleanAns := strings.TrimSpace(correctAnswer)
	if cleanAns == "" {
		return variants
	}

	switch category {
	case "connector":
		variants = append(variants, models.ContextVariant{
			Prompt:        fmt.Sprintf("The research hypotheses were rigorous; _______, empirical validation required additional trials. (Use: %s)", cleanAns),
			CorrectAnswer: cleanAns,
			Explanation:   "Use contrasting or causal transition appropriate for academic discourse.",
		})
		variants = append(variants, models.ContextVariant{
			Prompt:        fmt.Sprintf("Initial simulations failed to reproduce expected outcomes; _______, the engineers refined the model parameters. (Use: %s)", cleanAns),
			CorrectAnswer: cleanAns,
			Explanation:   "Maintain cohesive flow between independent scientific clauses.",
		})
	case "collocation":
		variants = append(variants, models.ContextVariant{
			Prompt:        fmt.Sprintf("Scholars generally agree that sustainable development plays a crucial role in economic policy. Complete the academic phrase: %s", cleanAns),
			CorrectAnswer: cleanAns,
			Explanation:   "Adhere to high-frequency AWL collocations.",
		})
	case "morpheme":
		variants = append(variants, models.ContextVariant{
			Prompt:        fmt.Sprintf("Complete the sentence with correct derivative: The government implemented a comprehensive str________ plan. (Root/target: %s)", cleanAns),
			CorrectAnswer: cleanAns,
			Explanation:   "Ensure correct morphological inflection.",
		})
	default:
		variants = append(variants, models.ContextVariant{
			Prompt:        fmt.Sprintf("Active recall in context: Re-apply the target knowledge [%s] under novel conditions.", cleanAns),
			CorrectAnswer: cleanAns,
			Explanation:   rule,
		})
	}

	return variants
}
