package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestPublicQuestionPayloadHidesAnswerKeys is a contract test for the public
// question endpoint: whatever the question type, the answer key must never be
// part of the payload the client receives.
func TestPublicQuestionPayloadHidesAnswerKeys(t *testing.T) {
	router, _, _ := setupTestRouter()

	types := []string{
		"READ_SELECT", "FILL_BLANKS", "C_TEST", "LISTEN_TYPE",
		"INTERACTIVE_READING", "INTERACTIVE_LISTENING", "WRITE_PHOTO",
		"INTERACTIVE_WRITING", "SPEAK_PHOTO", "READ_THEN_SPEAK",
		"INTERACTIVE_SPEAKING", "WRITING_SAMPLE", "SPEAKING_SAMPLE",
	}

	forbidden := []string{"correctAnswers", "correctIndex", "correct", "fullWord", "answerKey", "isReal"}
	served := 0

	for _, questionType := range types {
		request := httptest.NewRequest(http.MethodGet, "/api/v1/test/questions?type="+questionType, nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusOK {
			continue
		}

		var questions []map[string]interface{}
		if err := json.Unmarshal(recorder.Body.Bytes(), &questions); err != nil {
			t.Fatalf("%s: decode response: %v", questionType, err)
		}
		served += len(questions)

		for _, question := range questions {
			if _, leaked := question["correctAnswers"]; leaked {
				t.Fatalf("%s: question %v leaks correctAnswers", questionType, question["id"])
			}
			for _, key := range forbidden {
				if _, found := findKey(question["contentPayload"], key); found {
					t.Fatalf("%s: contentPayload of %v leaks %q: %s", questionType, question["id"], key, recorder.Body.String())
				}
			}
		}
	}

	if served == 0 {
		t.Fatal("the endpoint returned no questions for any type; the contract was not exercised")
	}
}

// findKey walks a decoded JSON value and reports whether a key exists.
func findKey(value interface{}, key string) (interface{}, bool) {
	switch typed := value.(type) {
	case map[string]interface{}:
		if found, ok := typed[key]; ok {
			return found, true
		}
		for _, nested := range typed {
			if found, ok := findKey(nested, key); ok {
				return found, true
			}
		}
	case []interface{}:
		for _, nested := range typed {
			if found, ok := findKey(nested, key); ok {
				return found, true
			}
		}
	}
	return nil, false
}
