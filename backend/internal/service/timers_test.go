package service

import "testing"

// The browser clock includes preparation and speaking; the server deadline
// must cover that plus enough time to upload the recording. Otherwise a learner
// who uses the full task time is guaranteed to be rejected.
func TestSpeakingStageDurationsCoverClientBudget(t *testing.T) {
	cases := []struct {
		stage       string
		clientTotal int
	}{
		{"SPEAK_PHOTO", 20 + 90},
		{"READ_THEN_SPEAK", 20 + 90},
		{"SPEAKING_SAMPLE", 30 + 180},
		{"INTERACTIVE_SPEAKING", 6 * 35},
	}

	for _, tc := range cases {
		server := StageDefaultDurations[tc.stage]
		if server < tc.clientTotal+30 {
			t.Errorf("%s: server duration %ds must cover client budget %ds + upload time", tc.stage, server, tc.clientTotal)
		}
	}
}
