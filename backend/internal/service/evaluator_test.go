package service

import (
	"testing"
)

func TestEvaluatorWriting(t *testing.T) {
	eval := NewEvaluator()

	// 1. Empty writing should strictly get 0.0 and EMPTY status
	resEmpty := eval.EvaluateWriting("session-1", "q-1", "WRITE_PHOTO", "", []string{"park", "bench"})
	if resEmpty.Score != 0.0 || resEmpty.Status != "EMPTY" {
		t.Fatalf("expected empty writing to receive 0.0 and EMPTY, got %f and %s", resEmpty.Score, resEmpty.Status)
	}

	// 2. Insufficient writing (< 5 words) should get 0.05 and INSUFFICIENT status
	resShort := eval.EvaluateWriting("session-1", "q-1", "WRITE_PHOTO", "A dog barking.", []string{"dog"})
	if resShort.Score != 0.05 || resShort.Status != "INSUFFICIENT" {
		t.Fatalf("expected short writing to receive 0.05 and INSUFFICIENT, got %f and %s", resShort.Score, resShort.Status)
	}

	// 3. Proper descriptive writing for photo with spatial markers and academic vocabulary
	goodPhotoText := "The photograph depicts a group of engineering students collaborating in a modern laboratory setting. In the foreground, two individuals are analyzing data on a computer screen, demonstrating focused teamwork. The environment appears equipped with sophisticated technical infrastructure."
	resGood := eval.EvaluateWriting("session-1", "sp-1", "WRITE_PHOTO", goodPhotoText, []string{"students", "laboratory", "computer"})
	if resGood.Score < 0.75 {
		t.Fatalf("expected high score for good descriptive photo text, got %f", resGood.Score)
	}
	if len(resGood.AcademicWords) == 0 {
		t.Fatalf("expected academic words detected, got none")
	}
	if resGood.CEFRLevel != "B2" && resGood.CEFRLevel != "C1" {
		t.Fatalf("expected B2 or C1 CEFR level, got %s", resGood.CEFRLevel)
	}

	oreoOffTopic := "In my opinion, higher education is a pivotal catalyst for socioeconomic mobility. This is primarily because university curricula foster advanced critical thinking. For instance, recent studies demonstrate that graduates adapt substantially faster. Ultimately, governments must prioritize equitable access to tertiary learning."
	resOff := eval.EvaluateWriting("session-1", "q-1", "WRITE_PHOTO", oreoOffTopic, []string{"park", "bench", "picnic", "trees"})
	if resOff.Score > 0.12 {
		t.Fatalf("off-topic OREO template must be capped, got %f", resOff.Score)
	}
	if resOff.RelevanceScore > 0.01 {
		t.Fatalf("off-topic writing must not look relevant, got %f", resOff.RelevanceScore)
	}

	resGibberish := eval.EvaluateWriting("session-1", "q-1", "WRITING_SAMPLE", "qwx zrtpl nkfvd brrr xzqpm vntk", []string{"university", "education"})
	if resGibberish.Score > 0.05 || resGibberish.Status != "INSUFFICIENT" {
		t.Fatalf("gibberish must be insufficient, got %f %s", resGibberish.Score, resGibberish.Status)
	}
}

func TestEvaluatorSpeaking(t *testing.T) {
	eval := NewEvaluator()

	// 1. Silence / 0s duration should receive 0.0 and EMPTY
	resSilent := eval.EvaluateSpeaking("session-1", "q-1", "SPEAK_PHOTO", "", 0.0, []string{})
	if resSilent.Score != 0.0 || resSilent.Status != "EMPTY" {
		t.Fatalf("expected silent speaking to receive 0.0 and EMPTY, got %f and %s", resSilent.Score, resSilent.Status)
	}

	// 2. High quality speaking with good duration, WPM, and academic vocabulary
	transcript := "In my opinion, technological innovations have fundamentally transformed human communication over the past decade. Furthermore, social platforms facilitate instant connection between distant colleagues, although excessive screen time can occasionally deteriorate interpersonal relationships. Consequently, maintaining a healthy digital balance remains crucial."
	resGood := eval.EvaluateSpeaking("session-1", "rts-1", "READ_THEN_SPEAK", transcript, 75.0, []string{"technology", "communication"})
	if resGood.Score < 0.70 {
		t.Fatalf("expected >= 0.70 score for fluent spoken response, got %f", resGood.Score)
	}
	if resGood.WPM <= 0 {
		t.Fatalf("expected positive WPM, got %f", resGood.WPM)
	}
	if len(resGood.Connectors) < 2 {
		t.Fatalf("expected discourse connectors detected, got %d", len(resGood.Connectors))
	}

	offTopic := "In my opinion, higher education is a pivotal catalyst for socioeconomic mobility. Furthermore, university curricula foster empirical inquiry. Consequently, governments must prioritize equitable access."
	resOff := eval.EvaluateSpeaking("session-1", "sp-1", "SPEAK_PHOTO", offTopic, 70.0, []string{"bicycle", "bridge", "river", "sunset"})
	if resOff.Score > 0.12 {
		t.Fatalf("off-topic speaking template must be capped, got %f", resOff.Score)
	}
}
