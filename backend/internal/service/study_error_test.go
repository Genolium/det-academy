package service

import (
	"encoding/json"
	"testing"
)

func TestHumanizeAnswerForErrorNotebook(t *testing.T) {
	cases := []struct {
		questionType string
		raw          string
		want         string
	}{
		{"READ_SELECT", `{"isReal":true}`, "yes"},
		{"READ_SELECT", `{"isReal":false}`, "no"},
		{"LISTEN_TYPE", `{"sentence":"The library is open."}`, "The library is open."},
		{"C_TEST", `{"answers":["ent","nimize"]}`, "ent, nimize"},
		{"FILL_BLANKS", `{"answers":["energy"]}`, "energy"},
		{"FILL_BLANKS", `"energy"`, "energy"},
	}
	for _, tc := range cases {
		if got := humanizeAnswer(tc.questionType, json.RawMessage(tc.raw)); got != tc.want {
			t.Errorf("humanizeAnswer(%s, %s) = %q, want %q", tc.questionType, tc.raw, got, tc.want)
		}
	}
}

func TestNormalizeRecallAnswerIgnoresPunctuation(t *testing.T) {
	if normalizeRecallAnswer("Yes.") != normalizeRecallAnswer(" yes ") {
		t.Fatal("punctuation and spacing must not change the recalled answer")
	}
	if normalizeRecallAnswer("The library is open!") != normalizeRecallAnswer("the library is open") {
		t.Fatal("sentence punctuation must not block mastery")
	}
}
