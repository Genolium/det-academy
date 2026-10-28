package service

import (
	"context"
	"fmt"
	"strings"

	"det-academy-backend/internal/models"
)

var adaptiveSlug = map[string]string{
	"READ_SELECT":           "read-and-select",
	"FILL_BLANKS":           "fill-in-the-blanks",
	"C_TEST":                "read-and-complete",
	"LISTEN_TYPE":           "listen-and-type",
	"INTERACTIVE_READING":   "read-and-complete",
	"INTERACTIVE_LISTENING": "listen-and-type",
	"SPEAK_PHOTO":           "speak-about-photo",
	"READ_THEN_SPEAK":       "speak-about-photo",
	"INTERACTIVE_SPEAKING":  "speaking-sample",
	"SPEAKING_SAMPLE":       "speaking-sample",
	"WRITE_PHOTO":           "write-about-the-photo",
	"WRITING_SAMPLE":        "writing-inspector",
	"INTERACTIVE_WRITING":   "writing-inspector",
}

var adaptiveTitle = map[string]string{
	"READ_SELECT": "Read and Select", "FILL_BLANKS": "Fill in the Blanks",
	"C_TEST": "Read and Complete", "LISTEN_TYPE": "Listen and Type",
	"INTERACTIVE_READING": "Interactive Reading", "INTERACTIVE_LISTENING": "Interactive Listening",
	"SPEAK_PHOTO": "Speak About Photo", "READ_THEN_SPEAK": "Read Then Speak",
	"INTERACTIVE_SPEAKING": "Interactive Speaking", "SPEAKING_SAMPLE": "Speaking Sample",
	"WRITE_PHOTO": "Write About Photo", "WRITING_SAMPLE": "Writing Sample",
	"INTERACTIVE_WRITING": "Interactive Writing",
}

// AdaptivePractice builds a practice set from the unmastered entries in the
// Error Notebook. The set is not sampled from the general question bank: the
// focus type is the one with the most unresolved errors, and the returned IDs
// are exactly those entries.
func (s *StudyService) AdaptivePractice(ctx context.Context, userID string) (*models.AdaptivePractice, error) {
	if userID == "" {
		return nil, fmt.Errorf("authorization required")
	}
	errors, err := s.storage.Study().GetErrors(ctx, userID)
	if err != nil {
		return nil, err
	}

	counts := map[string]int{}
	ids := map[string][]string{}
	for _, item := range errors {
		if item.Mastered {
			continue
		}
		if _, ok := adaptiveSlug[item.QuestionType]; !ok {
			continue
		}
		counts[item.QuestionType]++
		ids[item.QuestionType] = append(ids[item.QuestionType], item.ID)
	}

	focus := ""
	best := 0
	for questionType, count := range counts {
		if count > best {
			focus, best = questionType, count
		}
	}
	if focus == "" {
		// No unresolved errors: fall back to the weakest measured skill.
		focus = "READ_SELECT"
		if plan, planErr := s.GetStudyPlan(ctx, userID); planErr == nil && plan != nil {
			switch {
			case strings.Contains(plan.WeakestSkill, "Speaking"):
				focus = "SPEAK_PHOTO"
			case strings.Contains(plan.WeakestSkill, "Writing"):
				focus = "WRITING_SAMPLE"
			case strings.Contains(plan.WeakestSkill, "Reading"):
				focus = "READ_SELECT"
			case strings.Contains(plan.WeakestSkill, "Listening"):
				focus = "LISTEN_TYPE"
			}
		}
	}

	reason := "Ошибок в тетради нет: тренируем слабейший измеренный навык."
	if best > 0 {
		reason = fmt.Sprintf("%d неусвоенных ошибок типа %s. Сначала закройте их.", best, focus)
	}
	return &models.AdaptivePractice{
		FocusType:  focus,
		FocusSlug:  adaptiveSlug[focus],
		Title:      "Адаптивная практика: " + adaptiveTitle[focus],
		Reason:     reason,
		ErrorCount: best,
		Minutes:    10,
		ErrorIDs:   ids[focus],
	}, nil
}
