package service

import (
	"testing"

	"det-academy-backend/internal/models"
)

func TestSessionReviewPlanBuildsSkillsAndWeek(t *testing.T) {
	reading, listening, writing, speaking := 132, 118, 124, 140
	session := &models.TestSession{
		ReadingScore: &reading, ListeningScore: &listening,
		WritingScore: &writing, SpeakingScore: &speaking,
	}
	items := []models.ReviewItem{
		{StageName: "READ_SELECT", IsCorrect: true, TimeSpentSec: 12},
		{StageName: "READ_SELECT", IsCorrect: false, TimeSpentSec: 20},
		{StageName: "LISTEN_TYPE", IsCorrect: false, TimeSpentSec: 30},
		{StageName: "LISTEN_TYPE", IsCorrect: false, TimeSpentSec: 25},
		{StageName: "SPEAK_PHOTO", IsCorrect: true, TimeSpentSec: 90},
	}
	skills, plan, next := buildReviewPlan(session, items)
	if len(skills) != 4 {
		t.Fatalf("skills = %d", len(skills))
	}
	if next == "" || len(plan) < 2 {
		t.Fatalf("plan = %+v next=%q", plan, next)
	}
	var listeningSkill models.ReviewSkill
	for _, skill := range skills {
		if skill.Name == "listening" {
			listeningSkill = skill
		}
	}
	if listeningSkill.Correct != 0 || listeningSkill.Total != 2 || listeningSkill.Accuracy != 0 {
		t.Fatalf("listening = %+v", listeningSkill)
	}
	if plan[0].Href != "/practice?drill=listen-and-type" {
		t.Fatalf("first plan = %+v", plan[0])
	}
}
