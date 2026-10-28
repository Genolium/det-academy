package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/email"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
)

type digestSenderCapture struct {
	messages []email.Message
}

func (c *digestSenderCapture) Send(_ context.Context, msg email.Message) error {
	c.messages = append(c.messages, msg)
	return nil
}
func (c *digestSenderCapture) SendVerification(ctx context.Context, to, link string) error {
	return nil
}

type failingTransport struct{}

func (failingTransport) Send(context.Context, email.Message) error { return nil }
func (failingTransport) SendVerification(context.Context, string, string) error {
	return nil
}
func (failingTransport) Check(context.Context) error {
	return errors.New("dial tcp: connection refused")
}

func TestDigestFailsFastWhenTransportIsUnreachable(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	user := &models.User{ID: "digest-user-down", Email: "down@example.com", Name: "Down", EmailVerified: true}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	if err := store.Study().RecordActivity(ctx, user.ID, time.Now().UTC().Format("2006-01-02"), "test"); err != nil {
		t.Fatal(err)
	}
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	digest := NewDigestService(store, study, failingTransport{})
	sent, skipped, err := digest.SendWeekly(ctx, false)
	if err == nil || !strings.Contains(err.Error(), "transport unreachable") {
		t.Fatalf("expected a fail-fast transport error, got %v", err)
	}
	if sent != 0 || skipped != 0 {
		t.Fatalf("sent=%d skipped=%d, want 0/0", sent, skipped)
	}
}

func TestWeeklyDigestIsSentOncePerUserPerWeek(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	user := &models.User{ID: "digest-user", Email: "digest@example.com", Name: "Digest", EmailVerified: true}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	if err := store.Study().RecordActivity(ctx, user.ID, time.Now().UTC().Format("2006-01-02"), "test"); err != nil {
		t.Fatal(err)
	}
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	sender := &digestSenderCapture{}
	digest := NewDigestService(store, study, sender)

	// A dry run renders the message but must not claim the week.
	drySent, _, err := digest.SendWeekly(ctx, true)
	if err != nil {
		t.Fatal(err)
	}
	if drySent != 1 || len(sender.messages) != 0 {
		t.Fatalf("dry run: sent=%d messages=%d", drySent, len(sender.messages))
	}

	sent, _, err := digest.SendWeekly(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	if sent != 1 || len(sender.messages) != 1 {
		t.Fatalf("sent=%d messages=%d", sent, len(sender.messages))
	}
	if sender.messages[0].To != user.Email {
		t.Fatalf("recipient = %q", sender.messages[0].To)
	}

	// A second run in the same week must not send again.
	sent, skipped, err := digest.SendWeekly(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	if sent != 0 || skipped == 0 || len(sender.messages) != 1 {
		t.Fatalf("duplicate run: sent=%d skipped=%d messages=%d", sent, skipped, len(sender.messages))
	}
}

func TestDigestPreferencesRoundTripAndToken(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	user := &models.User{ID: "digest-pref-user", Email: "pref@example.com", Name: "Pref", EmailVerified: true}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	enabled, err := EmailDigestEnabled(ctx, store.Users(), user.ID)
	if err != nil || !enabled {
		t.Fatalf("default enabled = %v, err = %v", enabled, err)
	}
	if err := SetEmailDigestEnabled(ctx, store.Users(), user.ID, false); err != nil {
		t.Fatal(err)
	}
	enabled, err = EmailDigestEnabled(ctx, store.Users(), user.ID)
	if err != nil || enabled {
		t.Fatalf("after opt-out enabled = %v, err = %v", enabled, err)
	}
	token := DigestUnsubscribeToken(user.ID)
	parsed, err := ParseDigestUnsubscribeToken(token)
	if err != nil || parsed != user.ID {
		t.Fatalf("parsed = %q, err = %v", parsed, err)
	}
	if _, err := ParseDigestUnsubscribeToken(token + "x"); err == nil {
		t.Fatal("tampered token must be rejected")
	}
	if err := UnsubscribeEmailDigest(ctx, store.Users(), token); err != nil {
		t.Fatal(err)
	}
}

func TestDigestContainsUnsubscribeLinkAndSkipsOptOut(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	user := &models.User{ID: "digest-link-user", Email: "link@example.com", Name: "Link", EmailVerified: true}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	if err := store.Study().RecordActivity(ctx, user.ID, time.Now().UTC().Format("2006-01-02"), "test"); err != nil {
		t.Fatal(err)
	}
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	sender := &digestSenderCapture{}
	digest := NewDigestService(store, study, sender)
	sent, _, err := digest.SendWeekly(ctx, false)
	if err != nil || sent != 1 || len(sender.messages) != 1 {
		t.Fatalf("sent=%d messages=%d err=%v", sent, len(sender.messages), err)
	}
	if !strings.Contains(sender.messages[0].HTML, "/api/v1/email/unsubscribe?token=") {
		t.Fatalf("unsubscribe link missing: %s", sender.messages[0].HTML)
	}
	if err := SetEmailDigestEnabled(ctx, store.Users(), user.ID, false); err != nil {
		t.Fatal(err)
	}
	// A different week is not needed: the claim already exists, so this asserts
	// the preference path on a fresh user instead.
	other := &models.User{ID: "digest-optout-user", Email: "optout@example.com", Name: "Out", EmailVerified: true}
	if err := store.Users().Create(ctx, other); err != nil {
		t.Fatal(err)
	}
	if err := store.Study().RecordActivity(ctx, other.ID, time.Now().UTC().Format("2006-01-02"), "test"); err != nil {
		t.Fatal(err)
	}
	if err := SetEmailDigestEnabled(ctx, store.Users(), other.ID, false); err != nil {
		t.Fatal(err)
	}
	sent, skipped, err := digest.SendWeekly(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	if sent != 0 || skipped == 0 {
		t.Fatalf("opted-out user must be skipped, sent=%d skipped=%d", sent, skipped)
	}
}
