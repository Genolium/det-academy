package ai

import (
	"context"
	"math"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestAnalyzeSpeechMeasuresPausesAndRate(t *testing.T) {
	ffmpeg, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg is not installed")
	}
	output := filepath.Join(t.TempDir(), "sample.wav")
	command := exec.Command(ffmpeg,
		"-hide_banner", "-loglevel", "error", "-y",
		"-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono:d=1",
		"-f", "lavfi", "-i", "sine=frequency=440:duration=2:sample_rate=16000",
		"-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono:d=1",
		"-filter_complex", "[0][1][2]concat=n=3:v=0:a=1",
		output,
	)
	if combined, err := command.CombinedOutput(); err != nil {
		t.Fatalf("fixture: %v (%s)", err, combined)
	}

	metrics, err := AnalyzeSpeech(context.Background(), output, "one two three four five six seven eight")
	if err != nil {
		t.Fatalf("analyze: %v", err)
	}
	if math.Abs(metrics.DurationSec-4) > 0.3 {
		t.Fatalf("duration = %.2f, want 4", metrics.DurationSec)
	}
	if metrics.PauseCount < 2 {
		t.Fatalf("pause count = %d, want at least 2", metrics.PauseCount)
	}
	if metrics.PauseRatio < 0.35 || metrics.PauseRatio > 0.65 {
		t.Fatalf("pause ratio = %.2f, want around 0.5", metrics.PauseRatio)
	}
	if metrics.SpeechRate < 100 || metrics.SpeechRate > 140 {
		t.Fatalf("speech rate = %.1f, want around 120", metrics.SpeechRate)
	}
	if metrics.PronunciationStability <= 0 || metrics.PronunciationStability > 1 {
		t.Fatalf("stability = %.2f", metrics.PronunciationStability)
	}
	if len(metrics.Pauses) < 2 {
		t.Fatalf("pauses = %#v", metrics.Pauses)
	}
}

func TestAnalyzeSpeechCountsFillers(t *testing.T) {
	ffmpeg, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg is not installed")
	}
	output := filepath.Join(t.TempDir(), "tone.wav")
	command := exec.Command(ffmpeg,
		"-hide_banner", "-loglevel", "error", "-y",
		"-f", "lavfi", "-i", "sine=frequency=300:duration=3:sample_rate=16000",
		output,
	)
	if combined, err := command.CombinedOutput(); err != nil {
		t.Fatalf("fixture: %v (%s)", err, combined)
	}

	metrics, err := AnalyzeSpeech(context.Background(), output, "um I mean this is uh good")
	if err != nil {
		t.Fatalf("analyze: %v", err)
	}
	if metrics.FillerCount != 3 {
		t.Fatalf("fillers = %d, want 3", metrics.FillerCount)
	}
	if metrics.PauseCount != 0 {
		t.Fatalf("pause count = %d, want 0", metrics.PauseCount)
	}
}
