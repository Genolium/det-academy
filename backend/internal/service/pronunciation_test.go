package service

import (
	"encoding/json"
	"errors"
	"math"
	"strings"
	"testing"

	"det-academy-backend/internal/models"
)

func validPronunciationFixture() models.PronunciationReport {
	return models.PronunciationReport{
		Version:       1,
		Method:        "clarity-proxy",
		OverallScore:  1, // deliberately wrong: the parser must recompute it
		TimingSource:  "asr-segment-arrivals",
		DurationSec:   10,
		MeasuredWords: 2,
		Words: []models.PronunciationWord{
			{Word: "Morning", Start: 0.2, End: 0.7, Score: 1, Confidence: 0.9},
			{Word: "lecture", Start: 0.7, End: 1.2, Score: 0.5, Issue: "quiet", ReferenceWord: "lecture"},
		},
		Notes: []string{"Границы слов приблизительные"},
	}
}

func marshalReport(t *testing.T, report models.PronunciationReport) string {
	t.Helper()
	body, err := json.Marshal(report)
	if err != nil {
		t.Fatalf("marshal fixture: %v", err)
	}
	return string(body)
}

func TestParsePronunciationReportAbsent(t *testing.T) {
	report, err := ParsePronunciationReport("   ", 10)
	if err != nil || report != nil {
		t.Fatalf("expected nil report and nil error, got %v, %v", report, err)
	}
}

func TestParsePronunciationReportRecomputesOverallScore(t *testing.T) {
	report, err := ParsePronunciationReport(marshalReport(t, validPronunciationFixture()), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report.MeasuredWords != 2 {
		t.Fatalf("measured words = %d, want 2", report.MeasuredWords)
	}
	if math.Abs(report.OverallScore-0.75) > 1e-9 {
		t.Fatalf("overall score = %.3f, want 0.75 (weighted mean of words)", report.OverallScore)
	}
	if report.Words[0].Word != "Morning" {
		t.Fatalf("word text was modified: %q", report.Words[0].Word)
	}
}

func TestParsePronunciationReportClampsMeasuredWordCount(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.MeasuredWords = 99
	report, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report.MeasuredWords != len(report.Words) {
		t.Fatalf("measured words = %d, want clamped %d", report.MeasuredWords, len(report.Words))
	}
}

func TestParsePronunciationReportRejectsPhonemeClaims(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Method = "phoneme-accuracy"
	_, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if !errors.Is(err, ErrPronunciationInvalid) {
		t.Fatalf("expected ErrPronunciationInvalid, got %v", err)
	}
	if !strings.Contains(err.Error(), "unsupported method") {
		t.Fatalf("unexpected error text: %v", err)
	}
}

func TestParsePronunciationReportRecomputesPhonemes(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Version = 2
	fixture.Method = "g2p-phoneme-alignment"
	fixture.PhonemeModel = "lexicon+rule-g2p"
	fixture.Words[1].ReferenceWord = "lecture"
	fixture.Words[1].ReferencePhonemes = []string{"l", "e", "k", "tʃ", "ə"}
	fixture.Words[1].SpokenPhonemes = []string{"l", "e", "k", "ʃ", "ə"}
	fixture.Words[1].PhonemeDistance = 99 // deliberately wrong
	fixture.Words[1].PhonemeScore = 1     // deliberately wrong

	report, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	word := report.Words[1]
	if word.PhonemeDistance != 1 {
		t.Fatalf("distance = %d, want 1", word.PhonemeDistance)
	}
	if math.Abs(word.PhonemeScore-0.8) > 1e-9 {
		t.Fatalf("word phoneme score = %.3f, want 0.8", word.PhonemeScore)
	}
	if report.PhonemeMeasuredWords != 1 || math.Abs(report.PhonemeScore-0.8) > 1e-9 {
		t.Fatalf("report phoneme score = %.3f over %d words", report.PhonemeScore, report.PhonemeMeasuredWords)
	}
	if report.PhonemeModel != "lexicon+rule-g2p" {
		t.Fatalf("model = %q", report.PhonemeModel)
	}
}

func TestParsePronunciationReportRejectsIncompletePhonemePair(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Version = 2
	fixture.Method = "g2p-phoneme-alignment"
	fixture.Words[0].ReferencePhonemes = []string{"m", "ɔː", "n", "ɪ", "ŋ"}
	_, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if !errors.Is(err, ErrPronunciationInvalid) {
		t.Fatalf("expected ErrPronunciationInvalid, got %v", err)
	}
}

func TestParsePronunciationReportRejectsPhonemeMethodWithoutPairs(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Version = 2
	fixture.Method = "g2p-phoneme-alignment"
	_, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if !errors.Is(err, ErrPronunciationInvalid) {
		t.Fatalf("expected ErrPronunciationInvalid, got %v", err)
	}
}

func TestParsePronunciationReportRejectsInvalidWords(t *testing.T) {
	cases := map[string]func(*models.PronunciationReport){
		"empty words": func(report *models.PronunciationReport) { report.Words = nil },
		"blank word":  func(report *models.PronunciationReport) { report.Words[0].Word = "  " },
		"end before start": func(report *models.PronunciationReport) {
			report.Words[0].End = report.Words[0].Start
		},
		"score above one": func(report *models.PronunciationReport) { report.Words[0].Score = 1.4 },
		"negative start":  func(report *models.PronunciationReport) { report.Words[0].Start = -1 },
		"unknown issue":   func(report *models.PronunciationReport) { report.Words[0].Issue = "invented" },
		"confidence above one": func(report *models.PronunciationReport) {
			report.Words[0].Confidence = 1.5
		},
	}

	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			fixture := validPronunciationFixture()
			mutate(&fixture)
			if _, err := ParsePronunciationReport(marshalReport(t, fixture), 10); !errors.Is(err, ErrPronunciationInvalid) {
				t.Fatalf("expected ErrPronunciationInvalid, got %v", err)
			}
		})
	}
}

func TestParsePronunciationReportSanitizesText(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Words[0].Word = "Morn\x1bing\n"
	fixture.Notes = []string{"\x07note\x00 one"}

	report, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report.Words[0].Word != "Morning" {
		t.Fatalf("control characters were not stripped: %q", report.Words[0].Word)
	}
	if report.Notes[0] != "note one" {
		t.Fatalf("note was not sanitised: %q", report.Notes[0])
	}
}

func TestParsePronunciationReportClampsNotes(t *testing.T) {
	fixture := validPronunciationFixture()
	fixture.Notes = []string{
		strings.Repeat("a", 400),
		"two", "three", "four", "five", "six", "seven",
	}
	report, err := ParsePronunciationReport(marshalReport(t, fixture), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(report.Notes) != maxPronunciationNotes {
		t.Fatalf("notes = %d, want %d", len(report.Notes), maxPronunciationNotes)
	}
	if len([]rune(report.Notes[0])) != maxPronunciationNote {
		t.Fatalf("first note length = %d, want %d", len([]rune(report.Notes[0])), maxPronunciationNote)
	}
}

func TestParsePronunciationReportRejectsGarbage(t *testing.T) {
	if _, err := ParsePronunciationReport("{not json", 10); !errors.Is(err, ErrPronunciationInvalid) {
		t.Fatalf("expected ErrPronunciationInvalid, got %v", err)
	}
	if _, err := ParsePronunciationReport(`{"version":1}`, 10); !errors.Is(err, ErrPronunciationInvalid) {
		t.Fatalf("expected ErrPronunciationInvalid for empty payload, got %v", err)
	}
}
