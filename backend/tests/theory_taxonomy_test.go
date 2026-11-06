package tests

import (
	"context"
	"testing"

	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"
)

func TestTheoryTaxonomyMatchesOfficialTaskList(t *testing.T) {
	want := []string{
		"read-and-select", "fill-in-the-blanks", "read-and-complete",
		"listen-and-type", "interactive-reading", "interactive-listening",
		"write-about-photo", "interactive-writing", "speak-about-photo",
		"read-then-speak", "interactive-speaking", "writing-sample",
		"speaking-sample",
	}
	if len(service.LessonSlugs) != 13 || service.TotalTheoryLessons != 13 {
		t.Fatalf("got %d slugs / total %d, want 13", len(service.LessonSlugs), service.TotalTheoryLessons)
	}
	for i, slug := range want {
		if service.LessonSlugs[i] != slug {
			t.Fatalf("slug %d = %q, want %q", i, service.LessonSlugs[i], slug)
		}
	}
	for _, retired := range []string{"listen-and-select", "read-aloud", "read-listen-speak"} {
		if service.IsValidLessonSlug(retired) {
			t.Fatalf("retired slug %q is still valid", retired)
		}
	}
	for _, reference := range service.ReferenceLessonSlugs {
		if service.IsTrackableLessonSlug(reference) {
			t.Fatalf("reference %q must not be trackable", reference)
		}
	}
}

func TestTheoryProgressIgnoresReferenceAndRetiredSlugs(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	userID := "theory-taxonomy-user"
	for _, slug := range []string{
		"rules-and-technicalities", "subscores-and-cat-engine",
		"listen-and-select", "read-aloud", "read-listen-speak",
	} {
		if _, err := store.Theory().ToggleProgress(ctx, userID, slug); err != nil {
			t.Fatalf("seed %s: %v", slug, err)
		}
	}
	theory := service.NewTheoryService(store.Theory())
	progress, err := theory.GetProgress(ctx, userID)
	if err != nil {
		t.Fatal(err)
	}
	if progress.TotalLessons != 13 || progress.ProgressPercent != 0 || progress.IsAllCompleted {
		t.Fatalf("progress = %+v, want 0/13", *progress)
	}
}
