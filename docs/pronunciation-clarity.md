# Word-level pronunciation clarity (speaking studio)

## What this feature is

After a speaking answer, the learner sees the transcript as tappable words. Weak
words are highlighted and can be played back with a model pronunciation. The
panel shows an **index of clarity**, not phoneme accuracy.

## Feasibility findings (2026-10-28)

Checked on the development machine:

| Option | Availability | Word timings | Verdict |
| --- | --- | --- | --- |
| Yandex SpeechKit v1 (`speech/v1/stt:recognize`) — the configured adapter | key not configured locally; returns `{"result": "<text>"}` only | no | cannot drive per-word feedback |
| Yandex SpeechKit v3 async transcription | would return word-level times/confidence (per vendor docs) | yes | not verified here: no API key, no contract test |
| Whisper via the existing OpenAI-compatible `/audio/transcriptions` | no STT key locally | `verbose_json` can | optional future upgrade; not shipped |
| Local forced aligner (Whisper, Vosk, aeneas, phonemizer, torch) | not installed | — | unavailable |
| Docker for an isolated aligner | daemon not running | — | unavailable |
| `ffmpeg` / `ffprobe` | installed (Homebrew) | energy/pauses only | used for existing delivery metrics |
| Browser Web Speech API | available in Chrome | segment arrivals, confidence (browser-dependent) | used as the timing source |

Because no phoneme model or forced aligner exists in the current stack, a
phoneme score would be fabricated. The shipped feature is therefore an explicitly
labelled **pronunciation clarity proxy**.

## What is genuinely measured

From the learner's own recording, decoded with the Web Audio API:

- **voiced intervals** — 30 ms frames, 10 ms hop, RMS above the recording's own
  noise floor (10th percentile + 8 dB, floor −60 dBFS);
- **word windows** — browser recogniser segment arrivals, trimmed to the voiced
  intervals; labelled `asr-segment-arrivals` because the API has no timestamps;
- **per-word features** — voiced-frame ratio, RMS dBFS, zero-crossing rate;
- **relative scoring** — each word is compared with the speaker's median word, so
  microphone gain cancels out; recogniser confidence and reference-word mismatch
  add penalties when available;
- **reference alignment** — optional word-level Levenshtein alignment against a
  supplied reference text (not used by the current free-speaking prompts).

The overall number is the duration-weighted mean of the word scores. The server
recomputes it from the words and ignores the client-supplied total.

## What is not measured

- Correctness of individual phonemes, stress or intonation.
- A comparison against a reference **audio** waveform. Voices, rates and
  microphones differ, so a raw waveform comparison would not be meaningful
  without forced alignment.
- Word timings are approximate (±0.3–0.5 s) until a word-timed ASR provider is
  configured.

## Data flow

1. `useAudioRecorder` + Web Speech API capture the answer.
2. `SpeechTimeline` stamps word arrivals (pure, tested).
3. On finish, `capturePronunciationReport` decodes the blob, refines timings and
   measures words.
4. `buildPronunciationReport` produces `PronunciationReport`
   (`method: "clarity-proxy"`). The task prompt is stored as
   `referencePlaybackText` for the reference player only; it is never aligned
   against the answer.
5. The report is uploaded in the `pronunciation` form field with the audio.
6. `ParsePronunciationReport` validates/clamps it; it is stored in
   `evaluations.pronunciation` (migration 026) and returned with the evaluation.
7. `PronunciationFeedback` renders the word chips, highlights and playback.

The report is display-only and is never an input to `Score` or to the DET
estimate.

## Graceful degradation

If the browser has no Web Speech API, the audio cannot be decoded, or the
recording contains no measurable speech, no report is uploaded and the panel is
hidden. The app never substitutes a fabricated score.

## Tests

- `e2e/pronunciation-analysis.spec.ts` — deterministic fixtures for voicing,
  window measurement, scoring, alignment, timeline and the end-to-end pipeline.
- `e2e/pronunciation-feedback.spec.ts` — mocked evaluation renders per-word
  highlights; tapping a word triggers model playback.
- `backend/internal/service/pronunciation_test.go` — payload validation,
  recalculation of the overall score, sanitisation and rejection of
  `method != "clarity-proxy"`.
