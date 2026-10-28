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
	maxPhonemesPerWord    = 64
	maxPhonemeTokenRunes  = 8
)

var allowedPronunciationIssues = map[string]bool{
	"":               true,
	"quiet":          true,
	"unclear":        true,
	"muffled":        true,
	"unexpected":     true,
	"low-confidence": true,
}

var allowedPronunciationMethods = map[string]bool{
	"clarity-proxy":         true,
	"g2p-phoneme-alignment": true,
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

	if report.Version != 1 && report.Version != 2 {
		return nil, invalidPronunciation("unsupported version %d", report.Version)
	}
	if !allowedPronunciationMethods[report.Method] {
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
	phonemeSum := 0.0
	phonemeMeasured := 0
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
		if err := validateWordPhonemes(word); err != nil {
			return nil, err
		}
		if len(word.ReferencePhonemes) > 0 {
			phonemeSum += word.PhonemeScore
			phonemeMeasured++
		}

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

	if report.Method == "g2p-phoneme-alignment" && phonemeMeasured == 0 {
		return nil, invalidPronunciation("phoneme method without phoneme pairs")
	}
	if phonemeMeasured > 0 {
		report.PhonemeScore = math.Round((phonemeSum/float64(phonemeMeasured))*100) / 100
		report.PhonemeMeasuredWords = phonemeMeasured
		report.PhonemeModel = sanitizeDisplayText(report.PhonemeModel, 40)
		if report.PhonemeModel == "" {
			report.PhonemeModel = "lexicon+rule-g2p"
		}
	} else {
		report.PhonemeScore = 0
		report.PhonemeMeasuredWords = 0
		report.PhonemeModel = ""
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

// validateWordPhonemes recomputes the distance and score from the phoneme
// sequences. The client values are never trusted: a tampered payload cannot
// claim a perfect phoneme match while sending different sequences.
func validateWordPhonemes(word *models.PronunciationWord) error {
	reference := word.ReferencePhonemes
	spoken := word.SpokenPhonemes
	if len(reference) == 0 && len(spoken) == 0 {
		word.PhonemeDistance = 0
		word.PhonemeScore = 0
		return nil
	}
	if len(reference) == 0 || len(spoken) == 0 {
		return invalidPronunciation("word %q has an incomplete phoneme pair", word.Word)
	}
	if len(reference) > maxPhonemesPerWord || len(spoken) > maxPhonemesPerWord {
		return invalidPronunciation("word %q has too many phonemes", word.Word)
	}
	for _, list := range [][]string{reference, spoken} {
		for index := range list {
			token := sanitizeDisplayText(list[index], maxPhonemeTokenRunes)
			if token == "" || len([]rune(token)) > maxPhonemeTokenRunes {
				return invalidPronunciation("word %q has an invalid phoneme", word.Word)
			}
			list[index] = token
		}
	}
	distance := phonemeDistance(reference, spoken)
	denominator := len(reference)
	if len(spoken) > denominator {
		denominator = len(spoken)
	}
	score := 1 - float64(distance)/float64(denominator)
	if score < 0 {
		score = 0
	}
	word.PhonemeDistance = distance
	word.PhonemeScore = math.Round(score*100) / 100
	return nil
}

func phonemeDistance(reference, spoken []string) int {
	if len(reference) == 0 {
		return len(spoken)
	}
	previous := make([]int, len(spoken)+1)
	current := make([]int, len(spoken)+1)
	for index := range previous {
		previous[index] = index
	}
	for row := 1; row <= len(reference); row++ {
		current[0] = row
		for column := 1; column <= len(spoken); column++ {
			substitution := previous[column-1]
			if reference[row-1] != spoken[column-1] {
				substitution++
			}
			insert := current[column-1] + 1
			deleteCost := previous[column] + 1
			best := substitution
			if insert < best {
				best = insert
			}
			if deleteCost < best {
				best = deleteCost
			}
			current[column] = best
		}
		previous, current = current, previous
	}
	return previous[len(spoken)]
}
