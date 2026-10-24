package service

import (
	"encoding/json"
	"strconv"
	"strings"

	"det-academy-backend/internal/models"
)

// GradeClosedItem scores a selected-response item from the answer key.
// Open-ended writing/speaking types return handled=false so the caller can
// run the practice_feedback evaluator instead of trusting the browser.
func GradeClosedItem(q *models.Question, userResponse json.RawMessage) (isCorrect bool, score float64, handled bool) {
	if q == nil || len(q.CorrectAnswers) == 0 {
		return false, 0, false
	}
	trimmedResponse := strings.TrimSpace(string(userResponse))

	switch q.Type {
	case "READ_SELECT":
		var ca struct {
			IsReal bool `json:"isReal"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil {
			return false, 0, true
		}
		var userBool bool
		var userObj struct {
			Selected bool `json:"selected"`
			IsReal   bool `json:"isReal"`
		}
		if err := json.Unmarshal(userResponse, &userObj); err == nil && (userObj.Selected || userObj.IsReal) {
			userBool = userObj.Selected || userObj.IsReal
		} else if err := json.Unmarshal(userResponse, &userBool); err != nil {
			userBool = strings.EqualFold(trimmedResponse, "true") || strings.EqualFold(trimmedResponse, "real")
		}
		if userBool == ca.IsReal {
			return true, 1.0, true
		}
		return false, 0, true

	case "FILL_BLANKS":
		var ca struct {
			Answer         string `json:"answer"`
			FullWord       string `json:"fullWord"`
			MissingLetters string `json:"missingLetters"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil {
			return false, 0, true
		}
		expected := ca.MissingLetters
		if expected == "" {
			expected = ca.Answer
		}
		if expected == "" {
			expected = ca.FullWord
		}
		var userText string
		var userObj struct {
			Answer string `json:"answer"`
			Input  string `json:"input"`
		}
		if err := json.Unmarshal(userResponse, &userObj); err == nil {
			userText = userObj.Answer
			if userText == "" {
				userText = userObj.Input
			}
		}
		if userText == "" {
			if err := json.Unmarshal(userResponse, &userText); err != nil {
				userText = strings.Trim(trimmedResponse, `"'`)
			}
		}
		userText = strings.TrimSpace(userText)
		score = 0
		if expected != "" && strings.EqualFold(userText, strings.TrimSpace(expected)) {
			score = 1.0
		} else if ca.FullWord != "" && strings.EqualFold(userText, strings.TrimSpace(ca.FullWord)) {
			score = 1.0
		}
		return score >= 0.99, score, true

	case "LISTEN_TYPE":
		var ca struct {
			Text             string `json:"text"`
			ExpectedSentence string `json:"expectedSentence"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil {
			return false, 0, true
		}
		expected := ca.ExpectedSentence
		if expected == "" {
			expected = ca.Text
		}
		var userText string
		var userObj struct {
			Input string `json:"input"`
		}
		if err := json.Unmarshal(userResponse, &userObj); err == nil && userObj.Input != "" {
			userText = userObj.Input
		} else if err := json.Unmarshal(userResponse, &userText); err != nil {
			userText = strings.Trim(trimmedResponse, `"'`)
		}
		sim := StringSimilarity(userText, expected)
		return sim >= 0.85, sim, true

	case "C_TEST":
		var ca struct {
			Answers []string `json:"answers"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil || len(ca.Answers) == 0 {
			return false, 0, true
		}
		var userAnswers []string
		var userObj struct {
			Inputs map[string]string `json:"inputs"`
		}
		if err := json.Unmarshal(userResponse, &userAnswers); err != nil {
			if err := json.Unmarshal(userResponse, &userObj); err == nil && len(userObj.Inputs) > 0 {
				userAnswers = make([]string, len(ca.Answers))
				for i := range ca.Answers {
					userAnswers[i] = userObj.Inputs[strconv.Itoa(i)]
				}
			}
		}
		if len(userAnswers) == 0 {
			return false, 0, true
		}
		matched := 0
		for i, a := range ca.Answers {
			if i < len(userAnswers) && strings.EqualFold(strings.TrimSpace(userAnswers[i]), strings.TrimSpace(a)) {
				matched++
			}
		}
		score = float64(matched) / float64(len(ca.Answers))
		return score >= 0.7, score, true

	case "INTERACTIVE_READING":
		var ca struct {
			GapCorrect                string `json:"gapCorrect"`
			SentenceCorrectIndex      *int   `json:"sentenceCorrectIndex"`
			MainIdeaCorrectIndex      *int   `json:"mainIdeaCorrectIndex"`
			TitleCorrectIndex         *int   `json:"titleCorrectIndex"`
			HighlightCorrectSubstring string `json:"highlightCorrectSubstring"`
			HighlightCorrect          string `json:"highlightCorrect"`
		}
		var ur struct {
			Gap               string `json:"gap"`
			SentenceIndex     *int   `json:"sentenceIndex"`
			HighlightSentence string `json:"highlightSentence"`
			MainIdeaIndex     *int   `json:"mainIdeaIndex"`
			TitleIndex        *int   `json:"titleIndex"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil {
			return false, 0, true
		}
		if err := json.Unmarshal(userResponse, &ur); err != nil {
			return false, 0, true
		}
		const subtaskCount = 5
		correct := 0
		if strings.EqualFold(strings.TrimSpace(ur.Gap), strings.TrimSpace(ca.GapCorrect)) && ur.Gap != "" {
			correct++
		}
		if ur.SentenceIndex != nil && ca.SentenceCorrectIndex != nil && *ur.SentenceIndex == *ca.SentenceCorrectIndex {
			correct++
		}
		if ur.MainIdeaIndex != nil && ca.MainIdeaCorrectIndex != nil && *ur.MainIdeaIndex == *ca.MainIdeaCorrectIndex {
			correct++
		}
		if ur.TitleIndex != nil && ca.TitleCorrectIndex != nil && *ur.TitleIndex == *ca.TitleCorrectIndex {
			correct++
		}
		normalizeSentence := func(value string) string {
			value = strings.ToLower(strings.TrimSpace(value))
			value = strings.Trim(value, `".!?`)
			return strings.Join(strings.Fields(value), " ")
		}
		highlightExpected := ca.HighlightCorrectSubstring
		if highlightExpected == "" {
			highlightExpected = ca.HighlightCorrect
		}
		highlightCorrect := normalizeSentence(highlightExpected)
		highlightUser := normalizeSentence(ur.HighlightSentence)
		if highlightUser != "" && highlightCorrect != "" &&
			(strings.Contains(highlightCorrect, highlightUser) || strings.Contains(highlightUser, highlightCorrect)) {
			correct++
		}
		score = float64(correct) / float64(subtaskCount)
		return score >= 0.75, score, true

	case "INTERACTIVE_LISTENING":
		var ca struct {
			TurnsAnswers []int `json:"turnsAnswers"`
		}
		var ur struct {
			Turns []int `json:"turns"`
		}
		if err := json.Unmarshal(q.CorrectAnswers, &ca); err != nil || len(ca.TurnsAnswers) == 0 {
			return false, 0, true
		}
		if err := json.Unmarshal(userResponse, &ur); err != nil {
			return false, 0, true
		}
		matched := 0
		for i, expected := range ca.TurnsAnswers {
			if i < len(ur.Turns) && ur.Turns[i] == expected {
				matched++
			}
		}
		score = float64(matched) / float64(len(ca.TurnsAnswers))
		return score >= 0.75, score, true

	default:
		return false, 0, false
	}
}

func isOpenEndedQuestionType(questionType string) bool {
	switch questionType {
	case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE",
		"SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
		return true
	default:
		return false
	}
}
