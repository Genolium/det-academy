package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"unicode"

	"det-academy-backend/internal/models"
)

// Word-level clarity feedback is computed in the browser because only the
// browser has the recording and the recogniser timings before upload. It is
// feedback, never a grading input, so the server treats it as untrusted display
// data: bounded size, bounded word count, clamped numbers and sanitised text.

const (
	maxPronunciationBytes = 64 << 10
	maxPronunciationWords = 400
	maxPronunciationNotes = 5
	maxPronunciationNote  = 300
	maxReferenceTextRunes = 4000
)

var allowedPronunciationIssues = map[string]bool{
	"":               true,
	"quiet":          true,
	"unclear":        true,
	"muffled":        true,
	"unexpected":     true,
	"low-confidence": true,
}

var allowedTimingSources = map[string]bool{
	"asr-segment-arrivals": true,
	"uniform-estimate":     true,
}

// ErrPronunciationInvalid wraps every rejection reason so callers can log it
// without leaking details to the client.
var ErrPronunciationInvalid = errors.New("invalid pronunciation report")

func invalidPronunciation(format string, args ...interface{}) error {
	return fmt.Errorf("%w: %s", ErrPronunciationInvalid, fmt.Sprintf(format, args...))
}

// sanitizeDisplayText strips control characters and caps the length so a
// crafted upload cannot inject terminal/UI control sequences into the report.
func sanitizeDisplayText(value string, limit int) string {
	cleaned := strings.Map(func(r rune) rune {
		if r == '\n' || r == '\t' {
			return ' '
		}
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, strings.TrimSpace(value))
	runes := []rune(cleaned)
	if limit > 0 && len(runes) > limit {
		cleaned = string(runes[:limit])
	}
	return strings.TrimSpace(cleaned)
}

// ParsePronunciationReport validates the optional "pronunciation" form field.
// It returns nil for an absent field.
func ParsePronunciationReport(raw string, durationSec float64) (*models.PronunciationReport, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	if len(raw) > maxPronunciationBytes {
		return nil, invalidPronunciation("report exceeds %d bytes", maxPronunciationBytes)
	}

	var report models.PronunciationReport
	if err := json.Unmarshal([]byte(raw), &report); err != nil {
		return nil, invalidPronunciation("not valid JSON: %v", err)
	}

	if report.Version != 1 {
		return nil, invalidPronunciation("unsupported version %d", report.Version)
	}
	if report.Method != "clarity-proxy" {
		return nil, invalidPronunciation("unsupported method %q", report.Method)
	}
	if !allowedTimingSources[report.TimingSource] {
		return nil, invalidPronunciation("unsupported timing source %q", report.TimingSource)
	}
	if report.DurationSec <= 0 || report.DurationSec > 3600 {
		return nil, invalidPronunciation("duration out of range")
	}
	upperBound := math.Max(report.DurationSec, durationSec) + 2
	if len(report.Words) == 0 || len(report.Words) > maxPronunciationWords {
		return nil, invalidPronunciation("word count %d out of range", len(report.Words))
	}

	// Overall score is recomputed from the words; the client value is ignored
	// so a tampered payload cannot show a perfect score next to weak words.
	weighted := 0.0
	totalWeight := 0.0
	for index := range report.Words {
		word := &report.Words[index]
		word.Word = sanitizeDisplayText(word.Word, 64)
		if word.Word == "" {
			return nil, invalidPronunciation("word %d is empty", index)
		}
		if !finite(word.Start) || !finite(word.End) || word.Start < 0 || word.End <= word.Start {
			return nil, invalidPronunciation("word %d has invalid timing", index)
		}
		if word.End > upperBound {
			return nil, invalidPronunciation("word %d ends after the recording", index)
		}
		if !finite(word.Score) || word.Score < 0 || word.Score > 1 {
			return nil, invalidPronunciation("word %d has invalid score", index)
		}
		if !finite(word.Confidence) || word.Confidence < 0 || word.Confidence > 1 {
			return nil, invalidPronunciation("word %d has invalid confidence", index)
		}
		if !allowedPronunciationIssues[word.Issue] {
			return nil, invalidPronunciation("word %d has unknown issue %q", index, word.Issue)
		}
		word.ReferenceWord = sanitizeDisplayText(word.ReferenceWord, 64)

		weight := math.Max(0.06, word.End-word.Start)
		weighted += word.Score * weight
		totalWeight += weight
	}
	if totalWeight <= 0 {
		return nil, invalidPronunciation("no measurable words")
	}
	report.OverallScore = math.Round((weighted/totalWeight)*100) / 100
	if report.MeasuredWords < 0 || report.MeasuredWords > len(report.Words) {
		report.MeasuredWords = len(report.Words)
	}

	report.ReferenceText = sanitizeDisplayText(report.ReferenceText, maxReferenceTextRunes)
	report.ReferencePlaybackText = sanitizeDisplayText(report.ReferencePlaybackText, maxReferenceTextRunes)
	if !finite(report.ReferenceMatchRate) || report.ReferenceMatchRate < 0 || report.ReferenceMatchRate > 1 {
		return nil, invalidPronunciation("invalid reference match rate")
	}
	if report.ReferenceText == "" {
		report.ReferenceMatchRate = 0
	}

	if len(report.Notes) > maxPronunciationNotes {
		report.Notes = report.Notes[:maxPronunciationNotes]
	}
	for index := range report.Notes {
		report.Notes[index] = sanitizeDisplayText(report.Notes[index], maxPronunciationNote)
	}

	return &report, nil
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
