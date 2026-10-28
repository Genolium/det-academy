package ai

import (
	"context"
	"errors"
	"fmt"
	"math"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

// SpeechPause is one silence interval detected in the recorded answer.
type SpeechPause struct {
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

// SpeechMetrics are objective delivery measurements taken from the audio file.
// They describe how the answer was spoken, not what was said.
type SpeechMetrics struct {
	DurationSec            float64       `json:"durationSec"`
	SpeechRate             float64       `json:"speechRate"` // words per minute
	PauseRatio             float64       `json:"pauseRatio"`
	PauseCount             int           `json:"pauseCount"`
	FillerCount            int           `json:"fillerCount"`
	PronunciationStability float64       `json:"pronunciationStability"`
	Pauses                 []SpeechPause `json:"pauses"`
}

var (
	silenceStartRe = regexp.MustCompile(`silence_start: (-?\d+(?:\.\d+)?)`)
	silenceEndRe   = regexp.MustCompile(`silence_end: (\d+(?:\.\d+)?)`)
	rmsRe          = regexp.MustCompile(`RMS_level=(-?\d+(?:\.\d+)?)`)
	fillerRe       = regexp.MustCompile(`\b(um|uh|erm|er|hmm|you know|i mean)\b`)
)

const (
	silenceThresholdDB = -35
	silenceMinDuration = 0.30
)

// AnalyzeSpeech measures pacing, pauses and delivery stability with ffmpeg.
// A missing ffmpeg or an unreadable file is an error; the caller keeps the rest
// of the evaluation and simply omits the metrics.
func AnalyzeSpeech(ctx context.Context, audioPath, transcript string) (*SpeechMetrics, error) {
	if strings.TrimSpace(audioPath) == "" {
		return nil, errors.New("audio analysis: empty path")
	}
	ffmpeg, err := exec.LookPath("ffmpeg")
	if err != nil {
		return nil, errors.New("audio analysis: ffmpeg is not installed")
	}
	ffprobe, err := exec.LookPath("ffprobe")
	if err != nil {
		return nil, errors.New("audio analysis: ffprobe is not installed")
	}

	duration, err := probeDuration(ctx, ffprobe, audioPath)
	if err != nil {
		return nil, err
	}
	if duration <= 0 {
		return nil, errors.New("audio analysis: empty recording")
	}

	pauses, err := detectPauses(ctx, ffmpeg, audioPath, duration)
	if err != nil {
		return nil, err
	}

	pauseSeconds := 0.0
	for _, pause := range pauses {
		pauseSeconds += pause.End - pause.Start
	}

	words := len(strings.Fields(strings.TrimSpace(transcript)))
	metrics := &SpeechMetrics{
		DurationSec: round2(duration),
		SpeechRate:  round1(float64(words) / duration * 60),
		PauseRatio:  round2(math.Min(1, pauseSeconds/duration)),
		PauseCount:  len(pauses),
		FillerCount: len(fillerRe.FindAllStringIndex(strings.ToLower(transcript), -1)),
		Pauses:      pauses,
	}

	stability, err := deliveryStability(ctx, ffmpeg, audioPath)
	if err != nil {
		return nil, err
	}
	metrics.PronunciationStability = round2(stability)
	return metrics, nil
}

func probeDuration(ctx context.Context, ffprobe, audioPath string) (float64, error) {
	output, err := exec.CommandContext(ctx, ffprobe,
		"-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioPath,
	).Output()
	if err != nil {
		return 0, fmt.Errorf("audio analysis: probe failed: %w", err)
	}
	value, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64)
	if err != nil {
		return 0, fmt.Errorf("audio analysis: invalid duration: %w", err)
	}
	return value, nil
}

func detectPauses(ctx context.Context, ffmpeg, audioPath string, duration float64) ([]SpeechPause, error) {
	filter := fmt.Sprintf("silencedetect=noise=%ddB:d=%.2f", silenceThresholdDB, silenceMinDuration)
	output, _ := exec.CommandContext(ctx, ffmpeg,
		"-hide_banner", "-nostats", "-i", audioPath, "-af", filter, "-f", "null", "-",
	).CombinedOutput()

	text := string(output)
	starts := silenceStartRe.FindAllStringSubmatch(text, -1)
	ends := silenceEndRe.FindAllStringSubmatch(text, -1)
	pauses := make([]SpeechPause, 0, len(starts))
	for index, match := range starts {
		start, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			continue
		}
		if start < 0 {
			start = 0
		}
		end := duration
		if index < len(ends) {
			if parsed, err := strconv.ParseFloat(ends[index][1], 64); err == nil {
				end = parsed
			}
		}
		if end > duration {
			end = duration
		}
		if end-start < silenceMinDuration {
			continue
		}
		pauses = append(pauses, SpeechPause{Start: round2(start), End: round2(end)})
	}
	return pauses, nil
}

// deliveryStability measures how even the voiced parts of the recording are.
// It is a delivery signal (energy consistency), not a phoneme-level
// pronunciation score: those require a reference pronunciation model.
func deliveryStability(ctx context.Context, ffmpeg, audioPath string) (float64, error) {
	output, _ := exec.CommandContext(ctx, ffmpeg,
		"-hide_banner", "-nostats", "-i", audioPath,
		"-af", "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level",
		"-f", "null", "-",
	).CombinedOutput()

	values := make([]float64, 0, 64)
	for _, match := range rmsRe.FindAllStringSubmatch(string(output), -1) {
		value, err := strconv.ParseFloat(match[1], 64)
		if err != nil || value < -70 || value > 0 {
			continue
		}
		values = append(values, value)
	}
	if len(values) < 2 {
		return 0, nil
	}

	mean := 0.0
	for _, value := range values {
		mean += value
	}
	mean /= float64(len(values))
	variance := 0.0
	for _, value := range values {
		variance += (value - mean) * (value - mean)
	}
	stddev := math.Sqrt(variance / float64(len(values)))

	// 0 dB deviation is perfectly even; 8 dB of variation is audible instability.
	stability := 1 - stddev/8
	return math.Max(0, math.Min(1, stability)), nil
}

func round2(value float64) float64 { return math.Round(value*100) / 100 }
func round1(value float64) float64 { return math.Round(value*10) / 10 }
