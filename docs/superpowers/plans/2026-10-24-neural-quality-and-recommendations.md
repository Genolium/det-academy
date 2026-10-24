# Neural quality rubric + personalized recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productive speaking/writing answers are scored as overall answer quality (task meaning gated by language), persisted on evaluations and `learning_events`, and used to rank the dashboard “today” queue — without claiming an official DET score.

**Architecture:** Contour A is a `QualityJudge` in `internal/ai`. The required path is a local CPU rubric (`quality_rubric_v1`) that always boots. An optional local HTTP worker may supply cross-encoder scores; Ollama/OpenAI may only write feedback text unless `QUALITY_LLM_SCORES=true` and a golden-set gate passes. Contour B ranks the existing daily-task candidates with `ranker_v1` linear weights over server `StudentState`; if the ranker is missing, keep today’s heuristic and set `planSource = "heuristic_v1"`.

**Tech Stack:** Go 1.26 / Chi, existing `internal/ai` + `service.Evaluator`, PostgreSQL JSON/columns on `evaluations`, Next.js 16 `RubricFeedbackCard` + dashboard plan, optional Python FastAPI worker (not required for CI).

**Spec:** `docs/superpowers/specs/2026-10-24-neural-quality-and-recommendations-design.md`

## Global Constraints

- Do not emit official DET scores, university cutoffs, or copy that this rubric *is* DET. Provider must never be `det_official`.
- `overall_quality = min(raw, task_fulfillment)` always. Language must not rescue an off-task answer.
- EMPTY → all scores 0. Gibberish/non-English → `INSUFFICIENT`, `overall_quality = 0.05`. `task_fulfillment < 0.15` → `OFF_TOPIC`, `overall_quality = min(computed, 0.12)`.
- CPU path is required. App must score without Ollama/OpenAI/Python.
- LLM/cloud enrichment must not mutate numeric scores unless `QUALITY_LLM_SCORES=true` **and** `ai.LLMScoresAllowed()` returns true.
- Prompt text is built server-side from the **question snapshot** (mock) or stored question payload (practice). The client never supplies the official meaning of the item.
- `cefr_band` / `cefrLevel` is derived from `language_level` only, not from `overall_quality`.
- Do not edit `docs/superpowers/specs/2026-10-24-neural-quality-and-recommendations-design.md`.
- Do not git commit unless the user explicitly asks. Skip every “Commit” step.
- Work from `det-academy/` (Go module `det-academy-backend` lives in `backend/`).

## File map

| File | Responsibility |
|---|---|
| `backend/internal/ai/quality.go` | `QualityInput`, `QualityRubric`, `QualityJudge`, `CombineRubric`, CEFR-from-language, LLM score gate |
| `backend/internal/ai/quality_cpu.go` | Required CPU judge (`quality_rubric_v1`) |
| `backend/internal/ai/quality_cpu_test.go` | Golden cases: off-topic cap, weak language, gibberish, empty |
| `backend/internal/ai/quality_chain.go` | Fallback: worker → CPU. Never LLM for numbers by default |
| `backend/internal/ai/quality_worker.go` | Optional HTTP client (`QUALITY_WORKER_URL`) |
| `backend/internal/ai/quality_explain.go` | Optional text-only explanation via existing `Provider.Enrich` |
| `backend/internal/ai/prompt.go` | Productive prompt from payload (`altText`, `prompt`, part1/part2) |
| `backend/internal/models/models.go` | Rubric fields on `EvaluationResult`; `PlanSource` + `ModelVersion` |
| `backend/db/migrations/022_quality_rubric.sql` | Persist rubric columns |
| `backend/db/init.sql` | Same columns on canonical schema |
| `backend/internal/repository/postgres/postgres.go` | Save/load rubric columns |
| `backend/internal/repository/memory/memory.go` | Pass-through (struct already stored in memory) |
| `backend/internal/service/evaluator.go` | Fill lexical extras; apply judge; keep EMPTY/INSUFFICIENT gates |
| `backend/internal/service/evaluation_queue.go` | Snapshot prompt; judge numbers; enrich text only |
| `backend/internal/service/cat_service.go` | Productive `questionPromptText`; copy rubric on save |
| `backend/internal/service/study_service.go` | Practice grading via judge; `learning_events` rubric payload; ranker hook |
| `backend/internal/service/student_state.go` | Features from events / mastery / SRS / goals |
| `backend/internal/service/ranker.go` | `ranker_v1` linear ranker |
| `backend/internal/service/ranker_v1.json` | Versioned weights |
| `ml/quality_worker/app.py` | Optional local cross-encoder worker |
| `ml/ranker/train.py` | Offline ranker fit from exported events |
| `src/lib/api.ts` | Types |
| `src/components/audio/RubricFeedbackCard.tsx` | «задача / язык / итог» |
| `src/app/dashboard/page.tsx` | Show `planSource` + task reason |
| `src/lib/translations.ts` | Training-estimate copy, RU+EN |
| `docs/calibration.md` | Pointer: quality rubric ≠ DET calibration |
| `e2e/mocks.ts` | New optional fields |

---

### Task 1: CombineRubric + QualityJudge types

**Files:**
- Create: `backend/internal/ai/quality.go`
- Create: `backend/internal/ai/quality_test.go`

**Interfaces:**
- Consumes: existing `ai.Evidence`
- Produces: `QualityInput`, `QualityRubric`, `QualityJudge`, `CombineRubric`, `CEFRFromLanguage`, `Clamp01`, `IsSpeakingType`

- [ ] **Step 1: Write the failing tests**

Create `backend/internal/ai/quality_test.go`:

```go
package ai

import "testing"

func TestCombineRubricCapsOverallByTask(t *testing.T) {
	got := CombineRubric(QualityInput{QuestionType: "WRITING_SAMPLE"}, 0.10, 0.95, 0.90, 0)
	if got.Status != "OFF_TOPIC" {
		t.Fatalf("status=%s", got.Status)
	}
	if got.OverallQuality > 0.12 {
		t.Fatalf("overall=%f", got.OverallQuality)
	}
	if got.OverallQuality > got.TaskFulfillment {
		t.Fatalf("overall %f > task %f", got.OverallQuality, got.TaskFulfillment)
	}
	if got.CEFRBand != "C1" {
		t.Fatalf("CEFR must follow language_level, got %s", got.CEFRBand)
	}
}

func TestCombineRubricSpeakingRenormalizesFluency(t *testing.T) {
	got := CombineRubric(QualityInput{QuestionType: "SPEAK_PHOTO"}, 0.80, 0.70, 0.60, 0.50)
	if got.Fluency != 0.50 {
		t.Fatalf("fluency=%f", got.Fluency)
	}
	if got.OverallQuality > 0.80 {
		t.Fatalf("overall exceeded task: %f", got.OverallQuality)
	}
	if got.Status != "COMPLETED" {
		t.Fatalf("status=%s", got.Status)
	}
}

func TestCombineRubricEmpty(t *testing.T) {
	empty := CombineRubric(QualityInput{QuestionType: "WRITE_PHOTO", Response: ""}, 0.4, 0.4, 0.4, 0)
	if empty.Status != "EMPTY" || empty.OverallQuality != 0 {
		t.Fatalf("empty: %+v", empty)
	}
}

func TestCEFRFromLanguageOnly(t *testing.T) {
	if CEFRFromLanguage(0.90) != "C1" {
		t.Fatalf("got %s", CEFRFromLanguage(0.90))
	}
	if CEFRFromLanguage(0.10) != "A1" && CEFRFromLanguage(0.10) != "Pre-A1" {
		t.Fatalf("low language band=%s", CEFRFromLanguage(0.10))
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && go test ./internal/ai/ -run 'TestCombineRubric|TestCEFRFromLanguage' -count=1
```

Expected: FAIL with `undefined: CombineRubric` (and related).

- [ ] **Step 3: Write minimal implementation**

Create `backend/internal/ai/quality.go`:

```go
package ai

import (
	"context"
	"math"
	"os"
	"strings"
)

const QualityRubricVersion = "quality_rubric_v1"

type QualityInput struct {
	QuestionType string
	Prompt       string
	Response     string
	Transcript   string
	DurationSec  float64
}

type QualityRubric struct {
	TaskFulfillment float64    `json:"taskFulfillment"`
	LanguageLevel   float64    `json:"languageLevel"`
	Coherence       float64    `json:"coherence"`
	Fluency         float64    `json:"fluency"`
	OverallQuality  float64    `json:"overallQuality"`
	Status          string     `json:"status"`
	CEFRBand        string     `json:"cefrBand"`
	Feedback        string     `json:"feedback"`
	Evidence        []Evidence `json:"evidence,omitempty"`
	Provider        string     `json:"provider"`
	Model           string     `json:"model"`
	Version         string     `json:"version"`
}

type QualityJudge interface {
	Name() string
	Version() string
	Judge(ctx context.Context, in QualityInput) (QualityRubric, error)
}

func Clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

func IsSpeakingType(qType string) bool {
	switch qType {
	case "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
		return true
	default:
		return false
	}
}

func TextForJudge(in QualityInput) string {
	text := strings.TrimSpace(in.Response)
	if text == "" {
		text = strings.TrimSpace(in.Transcript)
	}
	return text
}

func CEFRFromLanguage(languageLevel float64) string {
	switch {
	case languageLevel >= 0.85:
		return "C1"
	case languageLevel >= 0.70:
		return "B2"
	case languageLevel >= 0.55:
		return "B1"
	case languageLevel >= 0.40:
		return "A2"
	case languageLevel > 0.05:
		return "A1"
	default:
		return "Pre-A1"
	}
}

// CombineRubric applies the versioned diploma formula.
// Writing: raw = 0.45*task + 0.35*language + 0.20*coherence
// Speaking: same weights plus fluency, then renormalized to 1.0
// overall = min(raw, task).
func CombineRubric(in QualityInput, task, language, coherence, fluency float64) QualityRubric {
	task = Clamp01(task)
	language = Clamp01(language)
	coherence = Clamp01(coherence)
	fluency = Clamp01(fluency)
	if !IsSpeakingType(in.QuestionType) {
		fluency = 0
	}

	text := TextForJudge(in)
	status := "COMPLETED"
	if strings.TrimSpace(text) == "" && (!IsSpeakingType(in.QuestionType) || in.DurationSec < 3) {
		return QualityRubric{
			Status: "EMPTY", CEFRBand: "Pre-A1",
			Provider: QualityRubricVersion, Version: QualityRubricVersion,
		}
	}

	var raw float64
	if IsSpeakingType(in.QuestionType) {
		raw = (0.40*task + 0.30*language + 0.15*coherence + 0.15*fluency)
	} else {
		raw = 0.45*task + 0.35*language + 0.20*coherence
	}
	overall := math.Min(raw, task)

	if task < 0.15 {
		status = "OFF_TOPIC"
		if overall > 0.12 {
			overall = 0.12
		}
	}

	return QualityRubric{
		TaskFulfillment: task,
		LanguageLevel:   language,
		Coherence:       coherence,
		Fluency:         fluency,
		OverallQuality:  math.Round(overall*100) / 100,
		Status:          status,
		CEFRBand:        CEFRFromLanguage(language),
		Provider:        QualityRubricVersion,
		Model:           QualityRubricVersion,
		Version:         QualityRubricVersion,
	}
}

func LLMScoresAllowed() bool {
	return os.Getenv("QUALITY_LLM_SCORES") == "true" && os.Getenv("QUALITY_LLM_GOLDEN_OK") == "true"
}
```

INSUFFICIENT is applied by `CPUQualityJudge` in Task 2, not by `CombineRubric`.

- [ ] **Step 4: Run tests and make sure they pass**

```bash
cd backend && go test ./internal/ai/ -run 'TestCombineRubric|TestCEFRFromLanguage' -count=1
```

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 2: CPUQualityJudge (required path)

**Files:**
- Create: `backend/internal/ai/quality_cpu.go`
- Create: `backend/internal/ai/quality_cpu_test.go`
- Create: `backend/internal/ai/testdata/quality_golden.json`

**Interfaces:**
- Consumes: `CombineRubric`, `QualityInput`, `QualityJudge`
- Produces: `CPUQualityJudge` with `Name() == "quality_rubric_v1"`, `Judge(...)`

This is the diploma CPU path: task from prompt–response overlap + char-Jaccard; language/coherence from a versioned linear head over lexical/syntactic features; fluency from duration/WPM. It is a local model with frozen weights, not ChatGPT.

- [ ] **Step 1: Write the failing golden tests**

Create `backend/internal/ai/testdata/quality_golden.json`:

```json
[
  {
    "id": "oreo-park-photo",
    "questionType": "WRITE_PHOTO",
    "prompt": "Describe the photo: a family picnic in a park with a wooden bench, trees, and a blanket on the grass.",
    "response": "In my opinion, higher education is a pivotal catalyst for socioeconomic mobility. This is primarily because university curricula foster advanced critical thinking. For instance, recent studies demonstrate that graduates adapt substantially faster. Ultimately, governments must prioritize equitable access to tertiary learning.",
    "wantStatus": "OFF_TOPIC",
    "maxOverall": 0.12,
    "maxTask": 0.15
  },
  {
    "id": "on-topic-weak-language",
    "questionType": "WRITE_PHOTO",
    "prompt": "Describe the photo: a family picnic in a park with a wooden bench, trees, and a blanket on the grass.",
    "response": "The photo show park. Family sit on bench. Trees is behind. Blanket on grass. They eat food.",
    "wantStatus": "COMPLETED",
    "minTask": 0.40,
    "maxLanguage": 0.55,
    "overallAtMostTask": true
  },
  {
    "id": "gibberish",
    "questionType": "WRITING_SAMPLE",
    "prompt": "Discuss whether universities should require internships.",
    "response": "qwx zrtpl nkfvd brrr xzqpm vntk",
    "wantStatus": "INSUFFICIENT",
    "maxOverall": 0.05
  },
  {
    "id": "empty",
    "questionType": "WRITE_PHOTO",
    "prompt": "Describe the photo of a bicycle on a bridge.",
    "response": "",
    "wantStatus": "EMPTY",
    "maxOverall": 0.0
  }
]
```

Create `backend/internal/ai/quality_cpu_test.go`:

```go
package ai

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

type goldenCase struct {
	ID                string  `json:"id"`
	QuestionType      string  `json:"questionType"`
	Prompt            string  `json:"prompt"`
	Response          string  `json:"response"`
	WantStatus        string  `json:"wantStatus"`
	MaxOverall        float64 `json:"maxOverall"`
	MaxTask           float64 `json:"maxTask"`
	MinTask           float64 `json:"minTask"`
	MaxLanguage       float64 `json:"maxLanguage"`
	OverallAtMostTask bool    `json:"overallAtMostTask"`
}

func TestCPUQualityJudgeGoldenSet(t *testing.T) {
	_, file, _, _ := runtime.Caller(0)
	raw, err := os.ReadFile(filepath.Join(filepath.Dir(file), "testdata", "quality_golden.json"))
	if err != nil {
		t.Fatal(err)
	}
	var cases []goldenCase
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatal(err)
	}
	judge := NewCPUQualityJudge()
	for _, tc := range cases {
		t.Run(tc.ID, func(t *testing.T) {
			got, err := judge.Judge(context.Background(), QualityInput{
				QuestionType: tc.QuestionType, Prompt: tc.Prompt, Response: tc.Response,
			})
			if err != nil {
				t.Fatal(err)
			}
			if got.Status != tc.WantStatus {
				t.Fatalf("status=%s want %s overall=%f task=%f lang=%f", got.Status, tc.WantStatus, got.OverallQuality, got.TaskFulfillment, got.LanguageLevel)
			}
			if tc.MaxOverall > 0 && got.OverallQuality > tc.MaxOverall {
				t.Fatalf("overall=%f > %f", got.OverallQuality, tc.MaxOverall)
			}
			if tc.WantStatus == "EMPTY" && got.OverallQuality != 0 {
				t.Fatalf("empty overall=%f", got.OverallQuality)
			}
			if tc.MaxTask > 0 && got.TaskFulfillment > tc.MaxTask {
				t.Fatalf("task=%f > %f", got.TaskFulfillment, tc.MaxTask)
			}
			if tc.MinTask > 0 && got.TaskFulfillment < tc.MinTask {
				t.Fatalf("task=%f < %f", got.TaskFulfillment, tc.MinTask)
			}
			if tc.MaxLanguage > 0 && got.LanguageLevel > tc.MaxLanguage {
				t.Fatalf("language=%f > %f", got.LanguageLevel, tc.MaxLanguage)
			}
			if got.OverallQuality > got.TaskFulfillment+1e-9 {
				t.Fatalf("overall %f > task %f", got.OverallQuality, got.TaskFulfillment)
			}
		})
	}
}

func TestCPUQualityJudgeAblationCap(t *testing.T) {
	judge := NewCPUQualityJudge()
	in := QualityInput{
		QuestionType: "WRITE_PHOTO",
		Prompt:       "Describe the photo: a family picnic in a park with a wooden bench, trees, and a blanket on the grass.",
		Response:     "In my opinion, higher education is a pivotal catalyst for socioeconomic mobility. This is primarily because university curricula foster advanced critical thinking. For instance, recent studies demonstrate that graduates adapt substantially faster. Ultimately, governments must prioritize equitable access to tertiary learning.",
	}
	got, err := judge.Judge(context.Background(), in)
	if err != nil {
		t.Fatal(err)
	}
	uncapped := 0.45*got.TaskFulfillment + 0.35*got.LanguageLevel + 0.20*got.Coherence
	if got.LanguageLevel < 0.4 {
		t.Fatalf("template still has language signal, lang=%f", got.LanguageLevel)
	}
	if uncapped <= got.OverallQuality {
		// Cap must be the thing that keeps the template from scoring high.
		if got.OverallQuality > 0.12 {
			t.Fatalf("template scored high even with cap: overall=%f uncapped=%f", got.OverallQuality, uncapped)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && go test ./internal/ai/ -run TestCPUQualityJudge -count=1
```

Expected: FAIL with `undefined: NewCPUQualityJudge`

- [ ] **Step 3: Implement CPUQualityJudge**

Create `backend/internal/ai/quality_cpu.go`. Keep it in this package; reuse stopword-like filtering locally so `ai` does not import `service` (that would cycle).

```go
package ai

import (
	"context"
	"math"
	"regexp"
	"strings"
	"unicode"
)

var (
	cpuWordRe  = regexp.MustCompile(`[a-zA-Z0-9'-]+`)
	cpuSentRe  = regexp.MustCompile(`[.!?]+\s*`)
	cpuStops   = map[string]bool{
		"a": true, "an": true, "the": true, "and": true, "or": true, "but": true,
		"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
		"with": true, "by": true, "from": true, "as": true, "is": true, "are": true,
		"was": true, "were": true, "be": true, "been": true, "it": true, "this": true,
		"that": true, "i": true, "you": true, "we": true, "they": true, "my": true,
		"your": true, "describe": true, "please": true, "photo": true, "image": true,
		"speak": true, "write": true, "following": true,
	}
	cpuAWL = map[string]bool{
		"significant": true, "perspective": true, "fundamental": true, "demonstrate": true,
		"facilitate": true, "comprehensive": true, "coherent": true, "empirical": true,
		"crucial": true, "collaborate": true, "framework": true, "substantial": true,
		"hypothesis": true, "implement": true, "potential": true, "primary": true,
	}
	cpuConnectors = []string{
		"furthermore", "moreover", "consequently", "therefore", "nevertheless",
		"in addition", "as a result", "in contrast", "ultimately", "for instance",
		"this is primarily because", "in my opinion",
	}
)

type CPUQualityJudge struct{}

func NewCPUQualityJudge() *CPUQualityJudge { return &CPUQualityJudge{} }

func (j *CPUQualityJudge) Name() string    { return QualityRubricVersion }
func (j *CPUQualityJudge) Version() string { return QualityRubricVersion }

func (j *CPUQualityJudge) Judge(ctx context.Context, in QualityInput) (QualityRubric, error) {
	_ = ctx
	text := TextForJudge(in)
	words := cpuWords(text)
	if len(words) == 0 {
		return CombineRubric(in, 0, 0, 0, 0), nil
	}
	if !cpuLooksEnglish(words) || (len(words) < 5 && !IsSpeakingType(in.QuestionType)) {
		rubric := CombineRubric(in, 0.05, 0.05, 0.05, 0)
		rubric.Status = "INSUFFICIENT"
		rubric.OverallQuality = 0.05
		rubric.Feedback = "Текст не похож на связный английский ответ по теме задания."
		return rubric, nil
	}
	if IsSpeakingType(in.QuestionType) && in.DurationSec < 3 {
		return CombineRubric(QualityInput{QuestionType: in.QuestionType}, 0, 0, 0, 0), nil
	}

	task := cpuTask(in.Prompt, text)
	language, coherence := cpuLanguageHead(text, words)
	fluency := 0.0
	if IsSpeakingType(in.QuestionType) && in.DurationSec > 0 {
		wpm := (float64(len(words)) / in.DurationSec) * 60
		switch {
		case wpm >= 90 && wpm <= 150:
			fluency = 1.0
		case wpm >= 60:
			fluency = 0.75
		default:
			fluency = 0.45
		}
	}
	rubric := CombineRubric(in, task, language, coherence, fluency)
	rubric.Feedback = cpuFeedback(rubric)
	return rubric, nil
}

func cpuWords(text string) []string {
	raw := cpuWordRe.FindAllString(strings.ToLower(text), -1)
	out := make([]string, 0, len(raw))
	for _, w := range raw {
		if len(w) > 1 {
			out = append(out, w)
		}
	}
	return out
}

func cpuContent(words []string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, w := range words {
		if cpuStops[w] || len(w) < 4 {
			continue
		}
		if _, ok := seen[w]; ok {
			continue
		}
		seen[w] = struct{}{}
		out = append(out, w)
	}
	return out
}

func cpuLooksEnglish(words []string) bool {
	if len(words) == 0 {
		return false
	}
	hits := 0
	for _, w := range words {
		if cpuStops[w] || cpuAWL[w] || strings.ContainsAny(w, "aeiouy") {
			ok := false
			for i := 1; i < len(w); i++ {
				if w[i] != w[0] {
					ok = true
					break
				}
			}
			if ok || cpuStops[w] || cpuAWL[w] {
				hits++
			}
		}
	}
	return float64(hits)/float64(len(words)) >= 0.45
}

func cpuTask(prompt, response string) float64 {
	pKeys := cpuContent(cpuWords(prompt))
	if len(pKeys) == 0 {
		return 0.40
	}
	lower := strings.ToLower(response)
	matched := 0
	for _, k := range pKeys {
		if strings.Contains(lower, k) {
			matched++
		}
	}
	overlap := float64(matched) / float64(len(pKeys))
	jaccard := cpuCharJaccard(strings.ToLower(prompt), lower)
	task := 0.75*overlap + 0.25*jaccard
	if matched == 0 {
		task = math.Min(task, 0.10)
	}
	return Clamp01(task)
}

func cpuCharJaccard(a, b string) float64 {
	grams := func(s string) map[string]struct{} {
		s = strings.Map(func(r rune) rune {
			if unicode.IsLetter(r) || unicode.IsSpace(r) {
				return unicode.ToLower(r)
			}
			return -1
		}, s)
		s = strings.Join(strings.Fields(s), " ")
		out := map[string]struct{}{}
		for i := 0; i+2 < len(s); i++ {
			out[s[i:i+3]] = struct{}{}
		}
		return out
	}
	ga, gb := grams(a), grams(b)
	if len(ga) == 0 || len(gb) == 0 {
		return 0
	}
	inter := 0
	for g := range ga {
		if _, ok := gb[g]; ok {
			inter++
		}
	}
	union := len(ga) + len(gb) - inter
	if union == 0 {
		return 0
	}
	return float64(inter) / float64(union)
}

func cpuLanguageHead(text string, words []string) (language, coherence float64) {
	if len(words) == 0 {
		return 0, 0
	}
	unique := map[string]struct{}{}
	awl := 0
	for _, w := range words {
		unique[w] = struct{}{}
		if cpuAWL[w] {
			awl++
		}
	}
	ttr := float64(len(unique)) / float64(len(words))
	sents := cpuSentRe.Split(strings.TrimSpace(text), -1)
	sentCount := 0
	for _, s := range sents {
		if strings.TrimSpace(s) != "" {
			sentCount++
		}
	}
	if sentCount == 0 {
		sentCount = 1
	}
	meanLen := float64(len(words)) / float64(sentCount)
	conn := 0
	lower := strings.ToLower(text)
	for _, c := range cpuConnectors {
		if strings.Contains(lower, c) {
			conn++
		}
	}
	repeat := 0.0
	counts := map[string]int{}
	for _, w := range words {
		if len(w) >= 4 && !cpuStops[w] {
			counts[w]++
			if counts[w] == 3 {
				repeat += 0.2
			}
		}
	}

	// Frozen linear head (thesis language proxy, not DET).
	z := -1.10 +
		0.28*math.Min(1, math.Log1p(float64(len(words)))/5.0) +
		0.45*math.Min(1, ttr) +
		0.55*math.Min(1, float64(awl)*2.0) +
		0.22*math.Min(1, meanLen/18.0) -
		0.35*math.Min(1, repeat)
	language = 1.0 / (1.0 + math.Exp(-z))

	coherence = Clamp01(0.25 + 0.20*math.Min(1, float64(sentCount)/6.0) + 0.35*math.Min(1, float64(conn)/3.0) + 0.20*(1-math.Min(1, repeat)))
	return Clamp01(language), coherence
}

func cpuFeedback(r QualityRubric) string {
	switch r.Status {
	case "EMPTY":
		return "Ответ отсутствует — задание не выполнено."
	case "INSUFFICIENT":
		return "Недостаточно связного английского текста для оценки качества ответа."
	case "OFF_TOPIC":
		return "Ответ не по теме задания. Шаблон или другой сюжет не засчитываются как выполнение задачи."
	default:
		return "Оценка качества ответа: выполнение задачи и уровень языка. Это тренировочный ориентир, не официальный балл DET."
	}
}
```

Tune until golden tests pass. If `on-topic-weak-language` task is below 0.40, lower the matched==0 clamp so shared content words (`park`, `bench`, `trees`, `blanket`, `grass`, `family`) count. If language is not below 0.55 for the weak sample, the linear head already penalizes short/simple text via log word count and TTR — keep `maxLanguage: 0.55`. If the OREO sample accidentally overlaps `park` tokens, it must not: the essay has no picnic vocabulary.

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/ai/ -count=1
```

Expected: PASS (existing provider tests + new quality tests)

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 3: Server-side productive prompt from snapshot payload

**Files:**
- Create: `backend/internal/ai/prompt.go`
- Create: `backend/internal/ai/prompt_test.go`
- Modify: `backend/internal/service/cat_service.go` (`questionPromptText`, ~828–858)

**Interfaces:**
- Consumes: question `contentPayload` JSON (`prompt`, `altText`, `part1Prompt`, `part2Prompt`, `photoDescription`)
- Produces: `ProductivePrompt(questionType string, payload []byte) string` — never uses client-supplied “official meaning”

- [ ] **Step 1: Write the failing test**

```go
package ai

import "testing"

func TestProductivePromptUsesAltAndParts(t *testing.T) {
	photo := []byte(`{"altText":"a red bicycle on a stone bridge at sunset","prompt":"Speak about the photo."}`)
	got := ProductivePrompt("SPEAK_PHOTO", photo)
	if got == "" || !containsAll(got, "bicycle", "bridge") {
		t.Fatalf("prompt=%q", got)
	}
	writing := []byte(`{"part1Prompt":"Should cities add bike lanes?","part2Prompt":"Who should pay for them?"}`)
	got = ProductivePrompt("INTERACTIVE_WRITING", writing)
	if !containsAll(got, "bike lanes", "pay") {
		t.Fatalf("iw prompt=%q", got)
	}
}

func containsAll(s string, parts ...string) bool {
	for _, p := range parts {
		if !stringsContainsFold(s, p) {
			return false
		}
	}
	return true
}
```

Implement `stringsContainsFold` in the test file with `strings.Contains(strings.ToLower(s), strings.ToLower(p))`.

- [ ] **Step 2: Run to verify fail**

```bash
cd backend && go test ./internal/ai/ -run TestProductivePrompt -count=1
```

Expected: FAIL `undefined: ProductivePrompt`

- [ ] **Step 3: Implement `ProductivePrompt` and wire `questionPromptText`**

`backend/internal/ai/prompt.go`:

```go
package ai

import (
	"encoding/json"
	"strings"
)

func ProductivePrompt(questionType string, payload []byte) string {
	var content map[string]interface{}
	_ = json.Unmarshal(payload, &content)
	get := func(k string) string {
		if content == nil {
			return ""
		}
		if v, ok := content[k].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}
	parts := []string{}
	switch questionType {
	case "WRITE_PHOTO", "SPEAK_PHOTO":
		parts = append(parts, get("prompt"), get("altText"), get("photoDescription"), get("description"))
	case "INTERACTIVE_WRITING":
		parts = append(parts, get("part1Prompt"), get("part2Prompt"), get("prompt"))
	case "WRITING_SAMPLE", "SPEAKING_SAMPLE", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING":
		parts = append(parts, get("prompt"), get("topic"), get("question"))
	default:
		parts = append(parts, get("prompt"), get("altText"), get("part1Prompt"), get("part2Prompt"))
	}
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, "\n")
}
```

In `questionPromptText`, before `default: return fallback`, add:

```go
case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE",
    "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
    if prompt := ai.ProductivePrompt(questionType, payload); prompt != "" {
        return prompt
    }
    return fallback
```

Add `"det-academy-backend/internal/ai"` to `cat_service.go` imports.

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/ai/ ./internal/service/ -count=1
```

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 4: Apply rubric onto EvaluationResult and stop LLM from mutating scores

**Files:**
- Modify: `backend/internal/models/models.go` (`EvaluationResult` ~596–625)
- Modify: `backend/internal/service/evaluator.go`
- Modify: `backend/internal/service/evaluator_test.go`
- Modify: `backend/internal/service/evaluation_queue.go`
- Modify: `backend/internal/service/evaluation_queue_test.go`
- Modify: `backend/internal/service/study_service.go` (`RecordPracticeAttempt` ~1390–1439)
- Modify: `backend/internal/service/cat_service.go` (sync evaluate paths that call `EvaluateWriting` / `EvaluateSpeaking`)

**Interfaces:**
- Consumes: `ai.QualityJudge.Judge`, `ai.ProductivePrompt`, `ai.LLMScoresAllowed`
- Produces: `EvaluationResult` with `taskFulfillment`, `languageLevel`, `coherence`, `fluency`, `overallQuality`; `Score == OverallQuality`; `Provider` is `quality_rubric_v1` (or worker name); `Status` may be `OFF_TOPIC`

- [ ] **Step 1: Extend evaluator tests**

Add to `evaluator_test.go`:

```go
func TestEvaluatorWritingExposesRubricAndOffTopicStatus(t *testing.T) {
	eval := NewEvaluator()
	oreo := "In my opinion, higher education is a pivotal catalyst for socioeconomic mobility. This is primarily because university curricula foster advanced critical thinking. For instance, recent studies demonstrate that graduates adapt substantially faster. Ultimately, governments must prioritize equitable access to tertiary learning."
	res := eval.EvaluateWriting("s", "q", "WRITE_PHOTO", oreo, []string{"park", "bench", "picnic", "trees"})
	if res.Status != "OFF_TOPIC" {
		t.Fatalf("status=%s", res.Status)
	}
	if res.OverallQuality > 0.12 || res.Score > 0.12 {
		t.Fatalf("overall=%f score=%f", res.OverallQuality, res.Score)
	}
	if res.Score != res.OverallQuality {
		t.Fatalf("score must store overall_quality")
	}
	if res.CEFRLevel == "" {
		t.Fatal("CEFR band is required")
	}
	if res.Provider == "det_official" {
		t.Fatal("must not claim official DET")
	}
}

func TestEvaluatorOnTopicWeakLanguage(t *testing.T) {
	eval := NewEvaluator()
	text := "The photo show park. Family sit on bench. Trees is behind. Blanket on grass. They eat food."
	res := eval.EvaluateWriting("s", "q", "WRITE_PHOTO", text, []string{"park", "bench", "picnic", "trees", "blanket"})
	if res.TaskFulfillment < res.LanguageLevel && res.LanguageLevel > 0.7 {
		t.Fatalf("weak language scored as advanced: lang=%f task=%f", res.LanguageLevel, res.TaskFulfillment)
	}
	if res.OverallQuality > res.TaskFulfillment {
		t.Fatalf("overall %f > task %f", res.OverallQuality, res.TaskFulfillment)
	}
}
```

CEFR stays `CEFRLevel`, computed from `LanguageLevel`. An off-topic fluent template may still show a high CEFR band; the overall percent must stay capped.

Add queue test `TestEvaluationQueueDoesNotLetEnrichmentChangeScore` using a fake `ai.Provider` that also implements `ai.Evaluator` and returns `Score: 0.99`. After processJob, score must still come from the judge (off-topic park prompt + OREO body → ≤ 0.12), while `Feedback` may be the enricher text.

Existing `TestEvaluationQueueUsesServerTranscript` currently expects `Provider == "practice_feedback"`. Change it to:

```go
if result.Provider != "quality_rubric_v1" {
    t.Fatalf("expected quality_rubric_v1 provider, got %s", result.Provider)
}
```

Existing neural test (`fake-neural`, score 0.8) must be rewritten: enrichment may set feedback, but numeric score comes from CPU judge unless `QUALITY_LLM_SCORES=true` and `QUALITY_LLM_GOLDEN_OK=true`. Split into two tests.

- [ ] **Step 2: Run to verify fail**

```bash
cd backend && go test ./internal/service/ -run 'TestEvaluatorWritingExposesRubric|TestEvaluationQueue' -count=1
```

Expected: FAIL on missing fields / old provider assertion.

- [ ] **Step 3: Implement**

Add to `models.EvaluationResult`:

```go
TaskFulfillment float64 `json:"taskFulfillment"`
LanguageLevel   float64 `json:"languageLevel"`
Coherence       float64 `json:"coherence"`
Fluency         float64 `json:"fluency"`
OverallQuality  float64 `json:"overallQuality"`
```

Change the Status comment to `"COMPLETED", "EMPTY", "INSUFFICIENT", "OFF_TOPIC", "FAILED", "PENDING"`.

Add helper in `evaluator.go`:

```go
func applyRubric(result *models.EvaluationResult, rubric ai.QualityRubric) {
	result.TaskFulfillment = rubric.TaskFulfillment
	result.LanguageLevel = rubric.LanguageLevel
	result.Coherence = rubric.Coherence
	result.Fluency = rubric.Fluency
	result.OverallQuality = rubric.OverallQuality
	result.Score = rubric.OverallQuality
	result.Status = rubric.Status
	result.CEFRLevel = rubric.CEFRBand
	result.Provider = rubric.Provider
	result.EvaluatorVersion = rubric.Version
	if rubric.Feedback != "" {
		result.Feedback = rubric.Feedback
		if len(result.Recommendations) == 0 || result.Recommendations[0] != rubric.Feedback {
			result.Recommendations = append([]string{rubric.Feedback}, result.Recommendations...)
		}
	}
	for _, span := range rubric.Evidence {
		result.EvidenceSpans = append(result.EvidenceSpans, models.EvidenceSpan{
			Start: span.Start, End: span.End, Text: span.Text, Label: span.Label, Suggestion: span.Suggestion,
		})
	}
}
```

Give `Evaluator` a `judge ai.QualityJudge` field.

```go
func NewEvaluator() *Evaluator {
	return NewEvaluatorWithJudge(ai.NewCPUQualityJudge())
}

func NewEvaluatorWithJudge(judge ai.QualityJudge) *Evaluator {
	if judge == nil {
		judge = ai.NewCPUQualityJudge()
	}
	return &Evaluator{judge: judge}
}
```

At the start of `EvaluateWriting` / `EvaluateSpeaking`, after computing `words` and the EMPTY/INSUFFICIENT English gates (keep those), call:

```go
prompt := strings.Join(contextKeywords, " ")
rubric, err := e.judge.Judge(context.Background(), ai.QualityInput{
    QuestionType: qType, Prompt: prompt, Response: userText, DurationSec: 0,
})
```

For speaking, pass `Transcript: transcript`, `DurationSec: durationSec`.

Then keep AWL/connectors/WPM/lexical extras as diagnostics, but **replace** `result.Score`, `Status`, `CEFRLevel`, `RelevanceScore` (`RelevanceScore = rubric.TaskFulfillment`), and provider via `applyRubric`. Remove the old `finalScore` path as the source of `Score`. Keep keyword overlap only as a diagnostic if useful; do not let it override the judge.

`EvaluateWriting` currently takes keywords, not the full prompt. Add:

```go
func (e *Evaluator) EvaluateWritingWithPrompt(sessionID, questionID, qType, userText, prompt string, contextKeywords []string) models.EvaluationResult
```

`EvaluateWriting(...)` becomes a wrapper that calls it with `prompt = strings.Join(contextKeywords, " ")`. Queue, CAT, and practice must call `EvaluateWritingWithPrompt` with `ai.ProductivePrompt(q.Type, payload)`. The judge prompt is `prompt`; keywords remain a diagnostic overlap input only.

**evaluation_queue.go:**

1. Resolve question from session assignment snapshot:

```go
func (q *EvaluationQueue) questionForJob(ctx context.Context, sessionID, questionID string) *models.Question {
	if assignment, err := q.sessionRepo.GetAssignedQuestion(ctx, sessionID, questionID); err == nil && assignment != nil {
		if snap := questionFromSnapshot(*assignment); snap != nil {
			return snap
		}
	}
	if question, err := q.questionRepo.GetByID(ctx, questionID); err == nil {
		return question
	}
	return nil
}
```

2. `prompt := ai.ProductivePrompt(questionType, question.ContentPayload)`
3. Always run CPU/chain judge (via Evaluator).
4. If `q.provider != nil`, call `Enrich` only. Copy `Feedback` + `Evidence`. Do **not** copy `Score`/`CEFR` unless `ai.LLMScoresAllowed()`.
5. Delete the branch that treats `q.provider.(ai.Evaluator)` as the numeric source of truth by default.
6. Keep `REQUIRE_NEURAL_EVALUATION` meaning “a QualityJudge ran”, which is always true with CPU. If you keep the env flag, interpret it as “worker required”; otherwise CPU is enough. **Do not fail closed when Ollama is missing.**

**study_service.go `RecordPracticeAttempt`:** grade open-ended via `NewEvaluator().EvaluateWritingWithPrompt` / `EvaluateSpeaking` using `ai.ProductivePrompt`. Put rubric fields into the learning event (Task 5).

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/ai/ ./internal/service/ -count=1
```

Expected: PASS. Off-topic OREO still ≤ 0.12. Queue server-transcript test provider is `quality_rubric_v1`. Fake neural no longer overwrites score.

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 5: Persist rubric + write it onto `learning_events`

**Files:**
- Create: `backend/db/migrations/022_quality_rubric.sql`
- Modify: `backend/db/init.sql` (`evaluations` table)
- Modify: `backend/tests/schema_convergence_test.go` (`legacyMissingColumns`)
- Modify: `backend/internal/repository/postgres/postgres.go` (`SaveEvaluation`, `GetSessionEvaluations`)
- Modify: `backend/internal/service/study_service.go` (`emitLearningEvent` payload in `RecordPracticeAttempt`)
- Modify: `backend/internal/service/evaluation_queue.go` (already saves full struct after Task 4)
- Modify: `backend/internal/service/cat_service.go` if mock completion events should include last rubric aggregates (optional; practice + evaluations are enough)

**Interfaces:**
- Consumes: `EvaluationResult` rubric fields
- Produces: DB columns + `learning_events.payload` keys `questionType`, `questionId`, `taskFulfillment`, `languageLevel`, `coherence`, `fluency`, `overallQuality`, `status`

- [ ] **Step 1: Write the schema test expectation**

Add to `legacyMissingColumns` in `schema_convergence_test.go`:

```go
{"evaluations", "task_fulfillment"},
{"evaluations", "language_level"},
{"evaluations", "coherence"},
{"evaluations", "fluency"},
{"evaluations", "overall_quality"},
```

- [ ] **Step 2: Run schema test if `TEST_DATABASE_URL` is set; otherwise run compile tests**

```bash
cd backend && go test ./internal/repository/postgres/ ./tests/ -count=1 -timeout 120s
```

Expected: schema test FAIL on missing columns when DB is available; compile of postgres SaveEvaluation still old.

- [ ] **Step 3: Migration + init.sql + postgres scan**

`backend/db/migrations/022_quality_rubric.sql`:

```sql
ALTER TABLE evaluations
    ADD COLUMN IF NOT EXISTS task_fulfillment DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS language_level DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS coherence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS fluency DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS overall_quality DOUBLE PRECISION NOT NULL DEFAULT 0.0;
```

Mirror the same five columns in `backend/db/init.sql` on `CREATE TABLE evaluations`.

Update `SaveEvaluation` INSERT/UPDATE and `GetSessionEvaluations` SELECT/Scan to include the five fields. UPDATE must persist them on conflict (today the ON CONFLICT patch only writes a subset — extend it so rubric changes are not dropped).

Practice event payload:

```go
emitLearningEvent(ctx, s.storage.Study(), userID, "practice_submitted", "practice:"+attemptID, map[string]any{
    "questionType":     questionType,
    "questionId":       questionID,
    "score":            score,
    "isCorrect":        isCorrect,
    "serverGraded":     serverGraded,
    "taskFulfillment":  eval.TaskFulfillment,
    "languageLevel":    eval.LanguageLevel,
    "coherence":        eval.Coherence,
    "fluency":          eval.Fluency,
    "overallQuality":   eval.OverallQuality,
    "status":           eval.Status,
    "evaluatorVersion": eval.EvaluatorVersion,
})
```

Only include rubric keys when an eval actually ran.

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/service/ ./internal/repository/... -count=1
```

If `TEST_DATABASE_URL` is set, also `go test ./tests/ -run TestMigrationsConverge -count=1`.

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 6: Judge chain (optional worker) + explanation-only LLM

**Files:**
- Create: `backend/internal/ai/quality_chain.go`
- Create: `backend/internal/ai/quality_worker.go`
- Create: `backend/internal/ai/quality_chain_test.go`
- Create: `ml/quality_worker/app.py`
- Create: `ml/quality_worker/requirements.txt`
- Create: `ml/quality_worker/README.md`
- Modify: `backend/cmd/server/main.go` (construct chain, pass into Evaluator / EvaluationQueue)

**Interfaces:**
- Consumes: `QUALITY_WORKER_URL` (optional), existing `ai.Provider`
- Produces: `NewQualityJudgeFromEnv() QualityJudge` — worker then CPU; `ExplainRubric(ctx, Provider, input, rubric) (feedback, evidence)`

- [ ] **Step 1: Write chain tests**

```go
func TestChainFallsBackToCPUWhenWorkerDown(t *testing.T) {
	cpu := NewCPUQualityJudge()
	chain := NewChainQualityJudge(&WorkerQualityJudge{BaseURL: "http://127.0.0.1:9", Client: &http.Client{Timeout: 50 * time.Millisecond}}, cpu)
	got, err := chain.Judge(context.Background(), QualityInput{
		QuestionType: "WRITE_PHOTO",
		Prompt:       "Describe the photo: a park bench under trees.",
		Response:     "qwx zrtpl nkfvd brrr xzqpm vntk",
	})
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "INSUFFICIENT" {
		t.Fatalf("status=%s provider=%s", got.Status, got.Provider)
	}
}

func TestChainDoesNotUseLLMScores(t *testing.T) {
	if LLMScoresAllowed() {
		t.Fatal("default env must not allow LLM scores")
	}
}
```

- [ ] **Step 2: Run to verify fail**

```bash
cd backend && go test ./internal/ai/ -run TestChain -count=1
```

Expected: FAIL `undefined: NewChainQualityJudge`

- [ ] **Step 3: Implement chain + worker client + tiny Python worker**

`WorkerQualityJudge` POSTs `{questionType, prompt, response, transcript, durationSec}` to `$QUALITY_WORKER_URL/judge` and decodes `QualityRubric`. On any error, return error so the chain falls back.

`NewChainQualityJudge(primary, fallback QualityJudge)` tries primary; on error uses fallback.

`NewQualityJudgeFromEnv()`:

```go
func NewQualityJudgeFromEnv() QualityJudge {
	cpu := NewCPUQualityJudge()
	url := strings.TrimRight(os.Getenv("QUALITY_WORKER_URL"), "/")
	if url == "" {
		return cpu
	}
	return NewChainQualityJudge(NewWorkerQualityJudge(url), cpu)
}
```

Wire `NewEvaluatorWithJudge(ai.NewQualityJudgeFromEnv())` from `main.go` and `NewEvaluationQueue` (add a judge argument or set it on the embedded Evaluator).

Python worker (`ml/quality_worker/app.py`) is optional and **must not be imported by Go tests**. It loads `sentence-transformers` CrossEncoder if installed, otherwise returns 503. README: local only, not a cloud API, not a DET scorer.

Explanation helper: after numeric judge, if `provider != nil`, `Enrich(...)` with the **already computed** score. Ignore any numeric fields in the model JSON.

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/ai/ ./internal/service/ -count=1
```

Expected: PASS without Python running.

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 7: Coach UI — задача / язык / итог

**Files:**
- Modify: `src/lib/api.ts` (`EvaluationResult` status union + rubric fields)
- Modify: `src/components/audio/RubricFeedbackCard.tsx`
- Modify: `src/lib/translations.ts` (RU+EN)
- Modify: `e2e/coach.spec.ts` and `e2e/mocks.ts` if they snapshot evaluation cards
- Modify: `src/components/test-engine/TestResultModal.tsx` only if it still claims DET-official from this rubric (it must not)

**Interfaces:**
- Consumes: `taskFulfillment`, `languageLevel`, `overallQuality`, `status`, `cefrLevel`, `feedback`
- Produces: three visible percents + one evidence sentence + “тренировочный ориентир, не официальный DET”

- [ ] **Step 1: Add types and copy**

`EvaluationResult` in `src/lib/api.ts`:

```ts
status: 'COMPLETED' | 'EMPTY' | 'INSUFFICIENT' | 'OFF_TOPIC' | 'FAILED' | 'PENDING';
taskFulfillment?: number;
languageLevel?: number;
coherence?: number;
fluency?: number;
overallQuality?: number;
```

In `translations.ts` under a new `rubricCard` (both `ru` and `en`):

```ts
rubricCard: {
  title: 'Разбор ответа',
  task: 'Задача',
  language: 'Язык',
  overall: 'Итог',
  trainingEstimate: 'Тренировочный ориентир, не официальный балл DET',
  offTopic: 'Не по теме задания',
  insufficient: 'Недостаточно текста',
  empty: 'Нет ответа',
}
```

English mirrors the same keys.

- [ ] **Step 2: Typecheck should still pass (optional fields)**

```bash
npx tsc --noEmit
```

Expected: PASS (new fields unused yet)

- [ ] **Step 3: Render the three-number breakdown**

In `RubricFeedbackCard`, replace the single “Точность рубрики” hero with three metrics. `overall = evaluation.overallQuality ?? evaluation.score`. Hide DET-official wording. If `status === 'OFF_TOPIC'`, badge uses `t.rubricCard.offTopic`. Always show `t.rubricCard.trainingEstimate` under the numbers. Keep AWL/connectors/audio below.

Use `useSettingsStore` locale if the card currently hardcodes Russian — match neighboring dashboard cards. If the card is RU-only today, add locale switching the same way `dashboard/page.tsx` reads `d`.

Manual check (when the app is running): an evaluation with `taskFulfillment: 0.1, languageLevel: 0.9, overallQuality: 0.12, status: 'OFF_TOPIC'` must not look like a high score.

- [ ] **Step 4: Typecheck + lint the touched files**

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 8: StudentState from server events

**Files:**
- Create: `backend/internal/service/student_state.go`
- Create: `backend/internal/service/student_state_test.go`

**Interfaces:**
- Consumes: `[]models.LearningEvent`, skill mastery map, SRS due counts, latest mock subscores, `models.UserGoal`
- Produces: `StudentState` used by Task 9

```go
type StudentState struct {
	Mastery          map[string]float64
	MeanTaskLast5    float64
	MeanLangLast5    float64
	OffTopicRate     float64
	OverdueSRS       int
	TheoryRemaining  int
	MinutesBudget    int
	WeakestSkill     string
	DaysLeft         int
	TargetGap        int
	HasProductiveN   int
}
```

- [ ] **Step 1: Write tests**

```go
func TestBuildStudentStateFromEvents(t *testing.T) {
	events := []models.LearningEvent{
		eventWith(`{"questionType":"WRITE_PHOTO","taskFulfillment":0.10,"languageLevel":0.80,"overallQuality":0.10,"status":"OFF_TOPIC"}`),
		eventWith(`{"questionType":"WRITE_PHOTO","taskFulfillment":0.20,"languageLevel":0.70,"overallQuality":0.12,"status":"OFF_TOPIC"}`),
		eventWith(`{"questionType":"SPEAK_PHOTO","taskFulfillment":0.70,"languageLevel":0.40,"overallQuality":0.40,"status":"COMPLETED"}`),
	}
	st := BuildStudentState(StudentStateInput{
		Events: events, OverdueSRS: 12, TheoryRemaining: 4,
		MinutesBudget: 30, WeakestSkill: "Speaking (Устная речь)",
		DaysLeft: 20, TargetGap: 15,
		Mastery: map[string]float64{"writing": 0.4, "speaking": 0.2},
	})
	if st.OffTopicRate < 0.5 {
		t.Fatalf("off-topic rate=%f", st.OffTopicRate)
	}
	if st.MeanTaskLast5 > 0.4 {
		t.Fatalf("mean task=%f", st.MeanTaskLast5)
	}
	if st.OverdueSRS != 12 || st.HasProductiveN != 3 {
		t.Fatalf("state=%+v", st)
	}
}
```

```go
func eventWith(payload string) models.LearningEvent {
	return models.LearningEvent{
		EventType: "practice_submitted",
		Payload:   json.RawMessage(payload),
	}
}
```

- [ ] **Step 2: Run to verify fail**

```bash
cd backend && go test ./internal/service/ -run TestBuildStudentState -count=1
```

Expected: FAIL `undefined: BuildStudentState`

- [ ] **Step 3: Implement `BuildStudentState`**

```go
type StudentStateInput struct {
	Events          []models.LearningEvent
	Mastery         map[string]float64
	OverdueSRS      int
	TheoryRemaining int
	MinutesBudget   int
	WeakestSkill    string
	DaysLeft        int
	TargetGap       int
}

func BuildStudentState(in StudentStateInput) StudentState
```

Parse only `practice_submitted` and `evaluation_completed` payloads. Average last 5 events that contain `taskFulfillment`. Off-topic rate = count(status==OFF_TOPIC) / count(productive). Ignore malformed JSON. Copy OverdueSRS, TheoryRemaining, MinutesBudget, WeakestSkill, DaysLeft, TargetGap, Mastery onto the result.

- [ ] **Step 4: Run tests**

```bash
cd backend && go test ./internal/service/ -run TestBuildStudentState -count=1
```

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 9: `ranker_v1` hook on the daily plan

**Files:**
- Create: `backend/internal/service/ranker.go`
- Create: `backend/internal/service/ranker_test.go`
- Create: `backend/internal/service/ranker_v1.json`
- Modify: `backend/internal/models/models.go` (`DailyTask.ModelVersion`, `StudyPlanResponse.PlanSource`)
- Modify: `backend/internal/service/study_service.go` (`GetStudyPlan`)
- Modify: `backend/tests/personalization_test.go`
- Modify: `src/lib/api.ts`, `src/app/dashboard/page.tsx`, `src/lib/translations.ts`, `e2e/mocks.ts`

**Interfaces:**
- Consumes: `StudentState`, existing heuristic `[]DailyTask` from `GetStudyPlan`
- Produces: 4–6 tasks, each with `reason` tied to events/rubric; `planSource` is `ranker_v1` or `heuristic_v1`; `modelVersion` on each ranked task

- [ ] **Step 1: Write ranker tests**

```go
func TestRankerPrefersSpeakingWhenTaskFulfillmentIsLow(t *testing.T) {
	candidates := []models.DailyTask{
		{ID: "task-srs", Type: "srs", EstimatedMinutes: 5, Priority: "MEDIUM", Reason: "srs"},
		{ID: "task-drill-speak", Type: "practice_drill", EstimatedMinutes: 15, Priority: "MEDIUM", Reason: "generic"},
		{ID: "task-theory", Type: "theory", EstimatedMinutes: 10, Priority: "LOW", Reason: "theory"},
	}
	ranked, src := RankDailyTasks(candidates, StudentState{
		MeanTaskLast5: 0.12, OffTopicRate: 0.6, MinutesBudget: 30,
		WeakestSkill: "Speaking (Устная речь)", OverdueSRS: 0, TheoryRemaining: 8,
		Mastery: map[string]float64{"speaking": 0.2, "writing": 0.5},
	}, defaultRankerWeights())
	if src != "ranker_v1" {
		t.Fatalf("source=%s", src)
	}
	if ranked[0].ID != "task-drill-speak" {
		t.Fatalf("first=%s reason=%s", ranked[0].ID, ranked[0].Reason)
	}
	if !strings.Contains(strings.ToLower(ranked[0].Reason), "task") &&
		!strings.Contains(ranked[0].Reason, "тем") &&
		!strings.Contains(ranked[0].Reason, "speaking") &&
		!strings.Contains(ranked[0].Reason, "устн") {
		t.Fatalf("reason not tied to quality: %s", ranked[0].Reason)
	}
	if strings.Contains(ranked[0].Reason, "CAT ENGINE") {
		t.Fatal("must not use CAT ENGINE as the student-facing reason")
	}
}

func TestRankerFallsBackWhenWeightsMissing(t *testing.T) {
	candidates := []models.DailyTask{{ID: "task-srs", Type: "srs", EstimatedMinutes: 5, Reason: "due", Priority: "HIGH"}}
	ranked, src := RankDailyTasks(candidates, StudentState{MinutesBudget: 15}, RankerWeights{})
	if src != "heuristic_v1" {
		t.Fatalf("source=%s", src)
	}
	if ranked[0].ID != "task-srs" {
		t.Fatalf("order changed: %s", ranked[0].ID)
	}
}
```

Add `TestStudyPlanExposesPlanSource` in `personalization_test.go`: after goals are set, `plan.PlanSource` is `heuristic_v1` or `ranker_v1`, never empty; every task still has `Reason` and fits the budget (existing assertions stay).

- [ ] **Step 2: Run to verify fail**

```bash
cd backend && go test ./internal/service/ ./tests/ -run 'TestRanker|TestDailyPlan|TestStudyPlanExposes' -count=1
```

Expected: FAIL undefined RankDailyTasks / missing PlanSource

- [ ] **Step 3: Implement ranker and hook it**

`ranker_v1.json`:

```json
{
  "version": "ranker_v1",
  "w_low_mastery": 1.2,
  "w_low_task": 1.6,
  "w_off_topic": 1.4,
  "w_overdue_srs": 1.1,
  "w_theory": 0.6,
  "w_weakest_skill": 1.0
}
```

Load via `embed` (`//go:embed ranker_v1.json`). Empty weights struct means fallback.

```go
type RankerWeights struct {
	Version        string  `json:"version"`
	WLowMastery    float64 `json:"w_low_mastery"`
	WLowTask       float64 `json:"w_low_task"`
	WOffTopic      float64 `json:"w_off_topic"`
	WOverdueSRS    float64 `json:"w_overdue_srs"`
	WTheory        float64 `json:"w_theory"`
	WWeakestSkill  float64 `json:"w_weakest_skill"`
}

func defaultRankerWeights() RankerWeights {
	return RankerWeights{
		Version: "ranker_v1", WLowMastery: 1.2, WLowTask: 1.6, WOffTopic: 1.4,
		WOverdueSRS: 1.1, WTheory: 0.6, WWeakestSkill: 1.0,
	}
}

func RankDailyTasks(tasks []models.DailyTask, state StudentState, weights RankerWeights) ([]models.DailyTask, string)
```

Empty `RankerWeights{}` (all zeros, empty Version) → return the input order and `"heuristic_v1"`. Otherwise `"ranker_v1"`.

Scoring (linear, thesis-sized):

```
score(task) =
  w_low_mastery * (1 - mastery[skill(task)]) +
  w_low_task * (1 - MeanTaskLast5) * isProductive(task) +
  w_off_topic * OffTopicRate * isProductive(task) +
  w_overdue_srs * min(1, OverdueSRS/20) * isSRS(task) +
  w_theory * min(1, TheoryRemaining/8) * isTheory(task) +
  w_weakest_skill * skillMatches(WeakestSkill, task)
```

Rewrite `Reason` when ranker runs, examples:

- speaking + low task: `"Устная речь: низкое выполнение задачи на фото-промптах"`
- high off-topic: `"Письмо: частые ответы не по теме — сначала смысл задания, потом шаблон"`
- overdue SRS: keep factual due-count reason

Never invent a university or target score. `fitTasksToBudget` still runs after ranking. Cap at 6 tasks.

`GetStudyPlan`:

1. Build heuristic `tasks` as today.
2. `events, _ := s.storage.Study().ListLearningEvents(ctx, userID, 50)`
3. `state := BuildStudentState(...)`
4. `tasks, source := RankDailyTasks(tasks, state, loadWeights())`
5. `plan.PlanSource = source`

Dashboard: small caption `planSource === 'ranker_v1' ? d.planRanked : d.planHeuristic`. Keep showing `task.reason`.

- [ ] **Step 4: Run tests + frontend types**

```bash
cd backend && go test ./internal/service/ ./tests/ -count=1
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit (skip unless the user asks)**

---

### Task 10: Offline ranker training script + calibration honesty

**Files:**
- Create: `ml/ranker/train.py`
- Create: `ml/ranker/README.md`
- Modify: `docs/calibration.md` (new section at the end; do not weaken the DET gate)

**Interfaces:**
- Consumes: exported `learning_events` JSONL
- Produces: printed weights / optional JSON compatible with `ranker_v1.json`; docs stating contour A ≠ DET

- [ ] **Step 1: Document the non-claim in calibration.md**

Append:

```markdown
## Quality rubric (practice_feedback / quality_rubric_v1)

The productive-skill rubric in `internal/ai` (`task_fulfillment`, `language_level`,
`overall_quality`) is a **training estimate**. It is not equated to the Duolingo
English Test and does not pass this calibration gate.

Diploma metrics for that contour:

- off-topic detection on the golden set in `backend/internal/ai/testdata/quality_golden.json`;
- language head is a documented lexical/syntactic proxy (optional CEFR sample later);
- ablation: overall with vs without `overall ≤ task` (templates must not score high).

Personalized recommendations (`ranker_v1`) are trained offline from `learning_events`.
They never output an official DET score.
```

- [ ] **Step 2: Training script that runs on a fixture without a live DB**

`ml/ranker/train.py` reads JSONL `{features: {low_mastery, low_task, off_topic, overdue_srs, theory, weakest}, label: 0|1}` where label=1 means the student completed that task type the next day. Fits `sklearn.linear_model.LogisticRegression` if sklearn is present, otherwise a closed-form least squares on the six weights. Writes JSON to stdout. Include `ml/ranker/testdata/events_fixture.jsonl` with ~20 rows.

README: hit@k / NDCG vs held-out week is the thesis metric; no online bandit in v1.

- [ ] **Step 3: Run the fixture**

```bash
python3 ml/ranker/train.py ml/ranker/testdata/events_fixture.jsonl
```

Expected: prints a JSON object with the six `w_*` keys and `"version": "ranker_v1"`. Exit 0.

- [ ] **Step 4: Full verification**

```bash
cd backend && go test ./internal/ai/ ./internal/service/ -count=1
npx tsc --noEmit
```

Expected: PASS. Manual UI check if the frontend is running: dashboard plan shows a real reason; result card shows задача/язык/итог and the training-estimate disclaimer.

Success criteria from the spec, mapped:

1. Off-topic OREO on a park photo → `task` low, `overall ≤ 0.12` — Task 2 golden + Task 4 evaluator test
2. On-topic weak language → task > language, overall ≤ task — Task 2 golden
3. Gibberish → INSUFFICIENT ~0.05 — Task 2 golden
4. Dashboard reason tied to events/rubric, not “CAT ENGINE” — Task 9
5. Scores without Ollama/OpenAI — CPU judge + chain fallback tests
6. No UI string claims official DET from this rubric — Task 7 + calibration.md

- [ ] **Step 5: Commit (skip unless the user asks)**

---

## Self-review (author)

1. **Spec coverage:** Goal/non-goals → Tasks 4, 7, 10. Rubric + hard rules → Task 1–2. CPU + optional worker + LLM text-only → Tasks 2, 6. Snapshot prompt → Task 3. Persist + events → Task 5. Recommender core → Tasks 8–10. UI three numbers → Task 7. Certificate/CAT aggregate unchanged — no task edits CAT overall scoring.
2. **Placeholders:** none. Optional Python worker is specified (503 if model missing).
3. **Types:** `QualityInput` / `QualityRubric` / `QualityJudge` / `StudentState` / `RankDailyTasks` / `PlanSource` / rubric fields on `EvaluationResult` are named the same in later tasks.
