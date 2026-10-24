package service

import (
	"encoding/json"
	"fmt"
	"strconv"
	"testing"

	"det-academy-backend/internal/models"
)

func TestGradeClosedItem_CTestLongIndices(t *testing.T) {
	// 14 blanks: tests indices 0..9 and critical 10..13 where rune('0'+i) previously failed
	answers := []string{
		"first", "second", "third", "fourth", "fifth",
		"sixth", "seventh", "eighth", "ninth", "tenth",
		"eleventh", "twelfth", "thirteenth", "fourteenth",
	}

	correctJSON, err := json.Marshal(map[string]interface{}{
		"answers": answers,
	})
	if err != nil {
		t.Fatalf("failed to marshal correct answers: %v", err)
	}

	q := &models.Question{
		ID:             "q-ctest-long",
		Type:           "C_TEST",
		CorrectAnswers: correctJSON,
	}

	// Case 1: user answers using inputs map with string keys "0".."13"
	inputs := make(map[string]string)
	for i, ans := range answers {
		inputs[strconv.Itoa(i)] = ans
	}
	userResp, err := json.Marshal(map[string]interface{}{
		"inputs": inputs,
	})
	if err != nil {
		t.Fatalf("failed to marshal user response: %v", err)
	}

	isCorrect, score, handled := GradeClosedItem(q, userResp)
	if !handled {
		t.Fatalf("expected handled=true for C_TEST")
	}
	if !isCorrect {
		t.Fatalf("expected isCorrect=true for all 14 correct answers, got false (score=%f)", score)
	}
	if score != 1.0 {
		t.Fatalf("expected score 1.0, got %f", score)
	}

	// Case 2: partial correctness (indices 10..13 correct, 0..4 wrong)
	inputsPartial := make(map[string]string)
	for i, ans := range answers {
		if i < 5 {
			inputsPartial[strconv.Itoa(i)] = "wrong"
		} else {
			inputsPartial[strconv.Itoa(i)] = ans
		}
	}
	userRespPartial, _ := json.Marshal(map[string]interface{}{
		"inputs": inputsPartial,
	})

	isCorrectPart, scorePart, handledPart := GradeClosedItem(q, userRespPartial)
	if !handledPart {
		t.Fatalf("expected handled=true")
	}
	expectedScore := 9.0 / 14.0 // ~0.6428, so isCorrect should be false (< 0.7)
	if isCorrectPart {
		t.Fatalf("expected isCorrect=false for score %f (<0.7)", scorePart)
	}
	if fmt.Sprintf("%.3f", scorePart) != fmt.Sprintf("%.3f", expectedScore) {
		t.Fatalf("expected score ~%f, got %f", expectedScore, scorePart)
	}
}

func TestGradeClosedItem_OpenEndedUnconfirmed(t *testing.T) {
	writingQ := &models.Question{
		ID:             "q-open-writing",
		Type:           "WRITING_SAMPLE",
		CorrectAnswers: json.RawMessage(`{"rubric":"academic"}`),
	}

	isCorrect, score, handled := GradeClosedItem(writingQ, json.RawMessage(`{"text":"sample essay"}`))
	if handled {
		t.Fatalf("open-ended writing item must not be handled by GradeClosedItem")
	}
	if isCorrect || score != 0 {
		t.Fatalf("unhandled items must return isCorrect=false, score=0")
	}
}
