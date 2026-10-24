package service

import (
	"math"
	"regexp"
	"strings"
	"time"

	"det-academy-backend/internal/models"
	"github.com/google/uuid"
)

// Evaluator provides linguistic and rubric-based assessment for open-ended DET tasks.
type Evaluator struct{}

func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// Academic Word List (AWL) tokens corresponding to CEFR B2-C1 bands
var AcademicWordList = map[string]bool{
	"significant": true, "perspective": true, "fundamental": true, "infrastructure": true,
	"subsequent": true, "paradigm": true, "intrinsic": true, "demonstrate": true,
	"facilitate": true, "enhance": true, "comprehensive": true, "allocate": true,
	"coherent": true, "deteriorate": true, "prevalent": true, "empirical": true,
	"sustainable": true, "implication": true, "crucial": true, "advocate": true,
	"collaborate": true, "distinguish": true, "framework": true, "predominant": true,
	"phenomenon": true, "substantial": true, "prioritize": true, "compensate": true,
	"reinforce": true, "equitable": true, "accumulate": true, "adequate": true,
	"ambiguous": true, "arbitrary": true, "compatible": true, "contemporary": true,
	"contradict": true, "dimension": true, "distinction": true, "dominant": true,
	"eliminate": true, "encounter": true, "equivalent": true, "hypothesis": true,
	"implement": true, "inevitable": true, "maximize": true, "minimal": true,
	"modify": true, "overall": true, "potential": true, "precise": true,
	"primary": true, "proportion": true, "rational": true, "regulate": true,
	"reluctant": true, "resolution": true, "restriction": true, "simulate": true,
	"somewhat": true, "specified": true, "subordinate": true, "sufficient": true,
	"supplement": true, "trigger": true, "underlying": true, "undertake": true,
	"utilize": true, "variable": true, "visible": true,
}

// Discourse connectors and transitional markers
var DiscourseConnectors = []string{
	"furthermore", "moreover", "consequently", "therefore", "nevertheless",
	"nonetheless", "in addition", "on the contrary", "as a result", "subsequently",
	"specifically", "in particular", "whereas", "conversely", "significantly",
	"in contrast", "ultimately", "notably", "demonstrating", "indicating",
	"similarly", "hence", "meanwhile", "alternatively", "accordingly",
	"firstly", "secondly", "in conclusion", "to summarize",
}

// Spatial and scene descriptive tokens for photo tasks
var PhotoSpatialTokens = []string{
	"depicts", "shows", "illustrates", "foreground", "background",
	"appears", "wearing", "collaborating", "analyzing", "working",
	"standing", "sitting", "holding", "surrounded", "gathering",
	"observing", "discussion", "environment", "setting", "outdoor",
	"indoor", "visible", "captured",
}

var wordTokenRegex = regexp.MustCompile(`[a-zA-Z0-9'-]+`)
var sentenceSplitRegex = regexp.MustCompile(`[.!?]+\s*`)

// Function words extracted from a prompt must not count as “on topic”.
// Otherwise an OREO essay about any subject matches “the/a/of” and looks relevant.
var englishStopwords = map[string]bool{
	"a": true, "an": true, "the": true, "and": true, "or": true, "but": true,
	"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
	"with": true, "by": true, "from": true, "as": true, "is": true, "are": true,
	"was": true, "were": true, "be": true, "been": true, "being": true,
	"it": true, "this": true, "that": true, "these": true, "those": true,
	"i": true, "you": true, "we": true, "they": true, "he": true, "she": true,
	"my": true, "your": true, "our": true, "their": true, "not": true, "no": true,
	"do": true, "does": true, "did": true, "have": true, "has": true, "had": true,
	"will": true, "would": true, "can": true, "could": true, "should": true,
	"may": true, "about": true, "into": true, "than": true, "then": true,
	"so": true, "if": true, "what": true, "which": true, "who": true, "how": true,
	"when": true, "where": true, "why": true, "there": true, "here": true,
	"also": true, "just": true, "more": true, "most": true, "some": true,
	"any": true, "all": true, "each": true, "other": true, "such": true,
	"only": true, "own": true, "same": true, "too": true, "very": true,
	"describe": true, "please": true, "following": true, "using": true,
	"based": true, "below": true, "above": true, "after": true, "before": true,
	"speak": true, "write": true, "seconds": true, "minute": true,
}

// ContentKeywords drops stopwords and tiny tokens so topical scoring uses
// the prompt’s actual subject, not grammar words.
func ContentKeywords(raw []string) []string {
	seen := make(map[string]struct{}, len(raw))
	out := make([]string, 0, len(raw))
	for _, kw := range raw {
		w := strings.ToLower(strings.TrimSpace(kw))
		if w == "" || englishStopwords[w] {
			continue
		}
		if len(w) < 4 && !AcademicWordList[w] {
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

func keywordOverlap(text string, keywords []string) (matched int, ratio float64, topicKnown bool) {
	keys := ContentKeywords(keywords)
	if len(keys) == 0 {
		return 0, 0, false
	}
	lower := strings.ToLower(text)
	for _, kw := range keys {
		if strings.Contains(lower, kw) {
			matched++
		}
	}
	return matched, float64(matched) / float64(len(keys)), true
}

func tokenLooksEnglish(w string) bool {
	if AcademicWordList[w] || englishStopwords[w] {
		return true
	}
	if len(w) < 2 || !strings.ContainsAny(w, "aeiouy") {
		return false
	}
	for i := 1; i < len(w); i++ {
		if w[i] != w[0] {
			return true
		}
	}
	return false
}

func looksLikeEnglish(words []string) bool {
	if len(words) == 0 {
		return false
	}
	hits := 0
	for _, w := range words {
		if tokenLooksEnglish(w) {
			hits++
		}
	}
	return float64(hits)/float64(len(words)) >= 0.45
}

func applyTopicFidelity(score, overlap float64, topicKnown bool) (float64, string) {
	if !topicKnown {
		return score, ""
	}
	if overlap <= 0 {
		if score > 0.12 {
			score = 0.12
		}
		return score, "Ответ не по теме задания. Шаблон или другой сюжет не засчитываются как выполнение задачи."
	}
	if overlap < 0.15 && score > 0.25 {
		return 0.25, "Слабая связь с темой. Нужно отвечать на конкретный вопрос или описывать это изображение, а не общий шаблон."
	}
	return score, ""
}

func TokenizeWords(text string) []string {
	raw := wordTokenRegex.FindAllString(strings.ToLower(text), -1)
	words := make([]string, 0, len(raw))
	for _, w := range raw {
		if len(w) > 1 {
			words = append(words, w)
		}
	}
	return words
}

func SplitSentences(text string) []string {
	parts := sentenceSplitRegex.Split(strings.TrimSpace(text), -1)
	sentences := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if len(trimmed) > 0 {
			sentences = append(sentences, trimmed)
		}
	}
	return sentences
}

// EvaluateWriting assesses written responses (WRITE_PHOTO, INTERACTIVE_WRITING, WRITING_SAMPLE).
func buildEvidenceSpans(text string) []models.EvidenceSpan {
	spans := []models.EvidenceSpan{}
	lower := strings.ToLower(text)
	counts := map[string]int{}
	for _, word := range TokenizeWords(text) {
		if len(word) < 4 {
			continue
		}
		counts[strings.ToLower(word)]++
	}
	for word, count := range counts {
		if count < 3 {
			continue
		}
		offset := strings.Index(lower, word)
		if offset >= 0 {
			spans = append(spans, models.EvidenceSpan{
				Start:      offset,
				End:        offset + len(word),
				Text:       text[offset : offset+len(word)],
				Label:      "repeated_word",
				Suggestion: "Разнообразьте лексику: слово повторяется несколько раз.",
			})
		}
	}
	return spans
}

func (e *Evaluator) EvaluateWriting(sessionID, questionID, qType string, userText string, contextKeywords []string) models.EvaluationResult {
	words := TokenizeWords(userText)
	wordCount := len(words)
	now := time.Now().UTC()

	result := models.EvaluationResult{
		ID:               uuid.New().String(),
		SessionID:        sessionID,
		QuestionID:       questionID,
		QuestionType:     qType,
		Status:           "COMPLETED",
		Score:            0.0,
		WordCount:        wordCount,
		UniqueWords:      0,
		LexicalDiversity: 0.0,
		AcademicWords:    []string{},
		Connectors:       []string{},
		RelevanceScore:   0.0,
		CEFRLevel:        "Pre-A1",
		Recommendations:  []string{},
		Provider:         "practice_feedback",
		EvaluatorVersion: "2026.1",
		FeedbackStatus:   "completed",
		EvidenceSpans:    []models.EvidenceSpan{},
		CreatedAt:        now,
	}

	// 1. Strict empty answer rejection
	if wordCount == 0 {
		result.Status = "EMPTY"
		result.Score = 0.0
		result.CEFRLevel = "Pre-A1"
		result.Recommendations = []string{
			"Ответ отсутствует. В официальном тесте DET за неотвеченные вопросы начисляется 0 баллов.",
		}
		return result
	}

	// 2. Insufficient volume check
	if wordCount < 5 {
		result.Status = "INSUFFICIENT"
		result.Score = 0.05
		result.CEFRLevel = "A1"
		result.Recommendations = []string{
			"Ответ слишком короткий (менее 5 слов) для оценки уровня владения языком. Сформулируйте развернутый ответ.",
		}
		return result
	}

	if !looksLikeEnglish(words) {
		result.Status = "INSUFFICIENT"
		result.Score = 0.05
		result.CEFRLevel = "Pre-A1"
		result.Recommendations = []string{
			"Текст не похож на связный английский ответ. Навык оценивается только по речи по теме задания.",
		}
		return result
	}

	// Calculate unique words and Lexical Diversity (TTR)
	uniqueMap := make(map[string]bool)
	for _, w := range words {
		uniqueMap[w] = true
	}
	result.UniqueWords = len(uniqueMap)
	result.LexicalDiversity = float64(result.UniqueWords) / float64(wordCount)

	// Detect academic words
	academicFound := make(map[string]bool)
	for _, w := range words {
		if AcademicWordList[w] {
			academicFound[w] = true
		}
	}
	for aw := range academicFound {
		result.AcademicWords = append(result.AcademicWords, aw)
	}

	// Detect discourse connectors
	lowerText := strings.ToLower(userText)
	for _, conn := range DiscourseConnectors {
		if strings.Contains(lowerText, conn) {
			result.Connectors = append(result.Connectors, conn)
		}
	}

	matchedKeywords, overlapRatio, topicKnown := keywordOverlap(userText, contextKeywords)

	// Task-specific rubric weighting
	var volumeScore, relevanceScore, diversityScore, finalScore float64

	switch qType {
	case "WRITE_PHOTO":
		// Recommended: 25 - 45 words
		if wordCount >= 25 && wordCount <= 50 {
			volumeScore = 1.0
		} else if wordCount > 50 {
			volumeScore = 0.95
		} else if wordCount >= 15 {
			volumeScore = 0.70
		} else if wordCount >= 8 {
			volumeScore = 0.45
		} else {
			volumeScore = 0.25
		}

		// Spatial / scene markers
		var spatialHits int
		for _, sm := range PhotoSpatialTokens {
			if strings.Contains(lowerText, sm) {
				spatialHits++
			}
		}
		if !topicKnown {
			relevanceScore = 0.40
		} else {
			relevanceScore = overlapRatio
			if matchedKeywords > 0 {
				relevanceScore = math.Min(1.0, relevanceScore+math.Min(0.25, float64(spatialHits)/8.0))
			}
		}

		diversityScore = math.Min(1.0, math.Max(0.3, result.LexicalDiversity*1.2))

		finalScore = (volumeScore * 0.40) + (relevanceScore * 0.40) + (diversityScore * 0.20)

		if wordCount < 25 {
			result.Recommendations = append(result.Recommendations, "Увеличьте объем описания до 25–45 слов, описывая передний и задний план.")
		}
		if spatialHits < 2 {
			result.Recommendations = append(result.Recommendations, "Используйте пространственные маркеры (in the background, depicts, appears to be).")
		}

	case "INTERACTIVE_WRITING":
		// Recommended: 50 - 100+ words per prompt
		targetWords := 75.0
		volumeRatio := float64(wordCount) / targetWords
		volumeScore = math.Min(1.0, math.Max(0.2, volumeRatio))

		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}

		diversityScore = math.Min(1.0, math.Max(0.3, result.LexicalDiversity*1.25))
		structureBonus := math.Min(0.15, float64(len(result.Connectors))*0.04+float64(len(result.AcademicWords))*0.03)

		finalScore = math.Min(1.0, (volumeScore*0.45)+(relevanceScore*0.25)+(diversityScore*0.20)+structureBonus)

		if wordCount < 60 {
			result.Recommendations = append(result.Recommendations, "Стремитесь написать не менее 75–100 слов для полноценного раскрытия темы.")
		}
		if len(result.Connectors) < 2 {
			result.Recommendations = append(result.Recommendations, "Добавьте связующие фразы (Furthermore, In addition, Consequently) для академической связности.")
		}
		if len(result.AcademicWords) < 2 {
			result.Recommendations = append(result.Recommendations, "Используйте академическую лексику (significant, crucial, perspective).")
		}

	case "WRITING_SAMPLE":
		// Recommended: 80 - 150+ words
		targetWords := 100.0
		volumeRatio := float64(wordCount) / targetWords
		volumeScore = math.Min(1.0, math.Max(0.2, volumeRatio))

		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}

		diversityScore = math.Min(1.0, math.Max(0.3, result.LexicalDiversity*1.3))
		structureBonus := math.Min(0.20, float64(len(result.Connectors))*0.05+float64(len(result.AcademicWords))*0.04)

		finalScore = math.Min(1.0, (volumeScore*0.45)+(relevanceScore*0.20)+(diversityScore*0.20)+structureBonus)

		if wordCount < 80 {
			result.Recommendations = append(result.Recommendations, "Writing Sample оценивается приемными комиссиями: стремитесь к 100–150 словам с развернутой аргументацией.")
		}
		if len(result.Connectors) < 3 {
			result.Recommendations = append(result.Recommendations, "Структурируйте абзацы при помощи логических переходов (On the one hand, Nevertheless, Ultimately).")
		}

	default:
		// Generic open-ended writing fallback
		volumeScore = math.Min(1.0, math.Max(0.2, float64(wordCount)/50.0))
		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}
		diversityScore = math.Min(1.0, result.LexicalDiversity)
		finalScore = (volumeScore * 0.5) + (relevanceScore * 0.3) + (diversityScore * 0.2)
	}

	finalScore, topicNote := applyTopicFidelity(finalScore, overlapRatio, topicKnown)
	if topicNote != "" {
		result.Recommendations = append([]string{topicNote}, result.Recommendations...)
	}

	result.RelevanceScore = math.Round(relevanceScore*100) / 100
	result.Score = math.Round(math.Min(1.0, math.Max(0.05, finalScore))*100) / 100
	result.CEFRLevel = DetermineCEFR(result.Score)

	return result
}

// EvaluateSpeaking assesses spoken responses (SPEAK_PHOTO, READ_THEN_SPEAK, INTERACTIVE_SPEAKING, SPEAKING_SAMPLE).
func (e *Evaluator) EvaluateSpeaking(sessionID, questionID, qType string, transcript string, durationSec float64, contextKeywords []string) models.EvaluationResult {
	words := TokenizeWords(transcript)
	wordCount := len(words)
	now := time.Now().UTC()

	result := models.EvaluationResult{
		ID:               uuid.New().String(),
		SessionID:        sessionID,
		QuestionID:       questionID,
		QuestionType:     qType,
		Status:           "COMPLETED",
		Score:            0.0,
		WordCount:        wordCount,
		UniqueWords:      0,
		LexicalDiversity: 0.0,
		AcademicWords:    []string{},
		Connectors:       []string{},
		RelevanceScore:   0.0,
		CEFRLevel:        "Pre-A1",
		SpeakingDuration: durationSec,
		WPM:              0.0,
		Recommendations:  []string{},
		Transcript:       transcript,
		Provider:         "practice_feedback",
		EvaluatorVersion: "2026.1",
		CreatedAt:        now,
	}

	// 1. Check for silence / empty audio
	if durationSec < 3.0 || (wordCount == 0 && transcript == "") {
		result.Status = "EMPTY"
		result.Score = 0.0
		result.CEFRLevel = "Pre-A1"
		result.Recommendations = []string{
			"Запись речи отсутствует или слишком короткая. В тесте DET тишина или отсутствие ответа оцениваются в 0 баллов.",
		}
		return result
	}

	// 2. Insufficient speech check
	if wordCount < 5 && durationSec < 10.0 {
		result.Status = "INSUFFICIENT"
		result.Score = 0.05
		result.CEFRLevel = "A1"
		result.Recommendations = []string{
			"Записанный фрагмент слишком короткий для оценки беглости и произношения. Говорите непрерывно до окончания таймера.",
		}
		return result
	}

	if wordCount >= 5 && !looksLikeEnglish(words) {
		result.Status = "INSUFFICIENT"
		result.Score = 0.05
		result.CEFRLevel = "Pre-A1"
		result.Recommendations = []string{
			"Расшифровка не похожа на связную английскую речь. Оценка ставится за ответ по теме, а не за заполнение таймера.",
		}
		return result
	}

	// Calculate words per minute (WPM)
	if durationSec > 0 {
		result.WPM = math.Round((float64(wordCount)/durationSec)*60.0*10) / 10
	}

	uniqueMap := make(map[string]bool)
	for _, w := range words {
		uniqueMap[w] = true
	}
	result.UniqueWords = len(uniqueMap)
	if wordCount > 0 {
		result.LexicalDiversity = float64(result.UniqueWords) / float64(wordCount)
	}

	// Detect academic words
	for _, w := range words {
		if AcademicWordList[w] {
			result.AcademicWords = append(result.AcademicWords, w)
		}
	}

	// Detect connectors
	lowerTranscript := strings.ToLower(transcript)
	for _, conn := range DiscourseConnectors {
		if strings.Contains(lowerTranscript, conn) {
			result.Connectors = append(result.Connectors, conn)
		}
	}

	matchedKeywords, overlapRatio, topicKnown := keywordOverlap(transcript, contextKeywords)

	var volumeScore, fluencyScore, relevanceScore, finalScore float64

	switch qType {
	case "SPEAK_PHOTO":
		// 90 seconds limit. Target: 70-130 words, duration >= 45s
		durationRatio := math.Min(1.0, durationSec/75.0)
		wordRatio := math.Min(1.0, float64(wordCount)/80.0)
		volumeScore = (durationRatio * 0.5) + (wordRatio * 0.5)

		// Fluency: 90-140 WPM is optimal
		if result.WPM >= 90 && result.WPM <= 150 {
			fluencyScore = 1.0
		} else if result.WPM >= 60 {
			fluencyScore = 0.75
		} else {
			fluencyScore = 0.45
		}

		var spatialHits int
		for _, sm := range PhotoSpatialTokens {
			if strings.Contains(lowerTranscript, sm) {
				spatialHits++
			}
		}
		if !topicKnown {
			relevanceScore = 0.40
		} else {
			relevanceScore = overlapRatio
			if matchedKeywords > 0 {
				relevanceScore = math.Min(1.0, relevanceScore+math.Min(0.25, float64(spatialHits)/8.0))
			}
		}

		finalScore = (volumeScore * 0.40) + (fluencyScore * 0.35) + (relevanceScore * 0.25)

		if durationSec < 50.0 {
			result.Recommendations = append(result.Recommendations, "Говорите дольше: стремитесь заполнить речью не менее 60–75 секунд из 90.")
		}
		if result.WPM < 80 {
			result.Recommendations = append(result.Recommendations, "Постарайтесь снизить количество длинных пауз для повышения темпа речи (цель: 100–130 слов в минуту).")
		}

	case "READ_THEN_SPEAK":
		// 90 seconds limit. Target: 80-140 words
		durationRatio := math.Min(1.0, durationSec/75.0)
		wordRatio := math.Min(1.0, float64(wordCount)/85.0)
		volumeScore = (durationRatio * 0.5) + (wordRatio * 0.5)

		if result.WPM >= 95 && result.WPM <= 155 {
			fluencyScore = 1.0
		} else if result.WPM >= 65 {
			fluencyScore = 0.80
		} else {
			fluencyScore = 0.50
		}

		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}

		structureBonus := math.Min(0.15, float64(len(result.Connectors))*0.04+float64(len(result.AcademicWords))*0.03)
		finalScore = math.Min(1.0, (volumeScore*0.40)+(fluencyScore*0.35)+(relevanceScore*0.20)+structureBonus)

		if durationSec < 60.0 {
			result.Recommendations = append(result.Recommendations, "Раскрывайте тему подробнее, приводя примеры из личного опыта или наблюдений.")
		}

	case "INTERACTIVE_SPEAKING":
		// 35 seconds per turn. Target: 30-55 words
		durationRatio := math.Min(1.0, durationSec/28.0)
		wordRatio := math.Min(1.0, float64(wordCount)/35.0)
		volumeScore = (durationRatio * 0.5) + (wordRatio * 0.5)

		if result.WPM >= 90 && result.WPM <= 150 {
			fluencyScore = 1.0
		} else if result.WPM >= 50 {
			fluencyScore = 0.75
		} else {
			fluencyScore = 0.40
		}

		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}
		finalScore = (volumeScore * 0.45) + (fluencyScore * 0.40) + (relevanceScore * 0.15)

		if durationSec < 20.0 {
			result.Recommendations = append(result.Recommendations, "В интерактивном диалоге используйте все 35 секунд: отвечайте на вопрос и поясняйте причину.")
		}

	case "SPEAKING_SAMPLE":
		// 1 to 3 minutes (180s). Target: 100-220 words
		durationRatio := math.Min(1.0, durationSec/120.0)
		wordRatio := math.Min(1.0, float64(wordCount)/130.0)
		volumeScore = (durationRatio * 0.5) + (wordRatio * 0.5)

		if result.WPM >= 95 && result.WPM <= 150 {
			fluencyScore = 1.0
		} else if result.WPM >= 65 {
			fluencyScore = 0.80
		} else {
			fluencyScore = 0.50
		}

		structureBonus := math.Min(0.15, float64(len(result.Connectors))*0.04+float64(len(result.AcademicWords))*0.03)
		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}
		finalScore = math.Min(1.0, (volumeScore*0.40)+(fluencyScore*0.35)+(relevanceScore*0.15)+structureBonus)

		if durationSec < 90.0 {
			result.Recommendations = append(result.Recommendations, "Speaking Sample отправляется в университеты вместе с сертификатом: говорите не менее 2 минут, демонстрируя структуру ответа.")
		}

	default:
		volumeScore = math.Min(1.0, float64(wordCount)/50.0)
		fluencyScore = 0.75
		if topicKnown {
			relevanceScore = overlapRatio
		} else {
			relevanceScore = 0.40
		}
		finalScore = (volumeScore * 0.4) + (fluencyScore * 0.3) + (relevanceScore * 0.3)
	}

	finalScore, topicNote := applyTopicFidelity(finalScore, overlapRatio, topicKnown)
	if topicNote != "" {
		result.Recommendations = append([]string{topicNote}, result.Recommendations...)
	}

	result.RelevanceScore = math.Round(relevanceScore*100) / 100
	result.Score = math.Round(math.Min(1.0, math.Max(0.05, finalScore))*100) / 100
	result.CEFRLevel = DetermineCEFR(result.Score)
	result.EvidenceSpans = buildEvidenceSpans(transcript)

	return result
}

// DetermineCEFR maps normalized score to CEFR level bands
func DetermineCEFR(score float64) string {
	switch {
	case score >= 0.85:
		return "C1"
	case score >= 0.70:
		return "B2"
	case score >= 0.55:
		return "B1"
	case score >= 0.40:
		return "A2"
	case score > 0.05:
		return "A1"
	default:
		return "Pre-A1"
	}
}
