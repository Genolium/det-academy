package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"det-academy-backend/internal/repository"
	"det-academy-backend/internal/repository/memory"
)

func newTestLimitGuard(t *testing.T) (*LimitGuard, repository.LimitRepository) {
	t.Helper()
	store := memory.New()
	return NewLimitGuard(store.Limits(), "test-secret"), store.Limits()
}

func requireLimitError(t *testing.T, err error, kind string) *LimitExceededError {
	t.Helper()
	var exceeded *LimitExceededError
	if !errors.As(err, &exceeded) {
		t.Fatalf("want LimitExceededError, got %v", err)
	}
	if exceeded.Kind != kind {
		t.Fatalf("limit kind = %q, want %q", exceeded.Kind, kind)
	}
	return exceeded
}

// Rotating the device header must not bypass the IP allowance.
func TestLimitGuardPerIPAcrossDevices(t *testing.T) {
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "2")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "100")
	guard, _ := newTestLimitGuard(t)
	ctx := context.Background()
	ip := "203.0.113.10"

	for attempt, device := range []string{"device-a", "device-b"} {
		if err := guard.Allow(ctx, LimitScopeMock, ip, HashDeviceID("test-secret", device)); err != nil {
			t.Fatalf("attempt %d must be allowed: %v", attempt+1, err)
		}
	}
	exceeded := requireLimitError(t, guard.Allow(ctx, LimitScopeMock, ip, HashDeviceID("test-secret", "device-c")), "ip")
	if exceeded.Limit != 2 || exceeded.Used != 2 {
		t.Fatalf("ip quota = %d/%d, want 2/2", exceeded.Used, exceeded.Limit)
	}
}

// A single device moving between IP addresses must still hit its own cap.
func TestLimitGuardPerDeviceAcrossIPs(t *testing.T) {
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "2")
	guard, _ := newTestLimitGuard(t)
	ctx := context.Background()
	device := HashDeviceID("test-secret", "stable-device")

	for attempt, ip := range []string{"198.51.100.1", "198.51.100.2"} {
		if err := guard.Allow(ctx, LimitScopeMock, ip, device); err != nil {
			t.Fatalf("attempt %d must be allowed: %v", attempt+1, err)
		}
	}
	exceeded := requireLimitError(t, guard.Allow(ctx, LimitScopeMock, "198.51.100.3", device), "device")
	if exceeded.Limit != 2 || exceeded.Used != 2 {
		t.Fatalf("device quota = %d/%d, want 2/2", exceeded.Used, exceeded.Limit)
	}
}

func TestLimitGuardRefundReturnsSlot(t *testing.T) {
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_IP", "1")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_DEVICE", "0")
	guard, _ := newTestLimitGuard(t)
	ctx := context.Background()
	ip := "203.0.113.50"
	device := HashDeviceID("test-secret", "refund-device")

	if err := guard.Allow(ctx, LimitScopeSpeaking, ip, device); err != nil {
		t.Fatalf("first allow: %v", err)
	}
	guard.Refund(ctx, LimitScopeSpeaking, ip, device)
	if err := guard.Allow(ctx, LimitScopeSpeaking, ip, device); err != nil {
		t.Fatalf("allow after refund must succeed: %v", err)
	}
}

func TestLimitGuardDeviceDenialRefundsIP(t *testing.T) {
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_IP", "2")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_DEVICE", "1")
	guard, _ := newTestLimitGuard(t)
	ctx := context.Background()
	device := HashDeviceID("test-secret", "shared-device")

	if err := guard.Allow(ctx, LimitScopeSpeaking, "198.51.100.10", device); err != nil {
		t.Fatalf("first allow: %v", err)
	}
	// Same device from a new IP: device cap rejects it, IP slot must be returned.
	requireLimitError(t, guard.Allow(ctx, LimitScopeSpeaking, "198.51.100.11", device), "device")
	if err := guard.Allow(ctx, LimitScopeSpeaking, "198.51.100.11", HashDeviceID("test-secret", "another-device")); err != nil {
		t.Fatalf("IP slot was not refunded after device denial: %v", err)
	}
}

func TestLimitGuardWindowRolloverResets(t *testing.T) {
	t.Setenv("DAILY_AUTH_LIMIT_PER_IP", "1")
	t.Setenv("DAILY_AUTH_LIMIT_PER_DEVICE", "100")
	guard, _ := newTestLimitGuard(t)
	ctx := context.Background()
	ip := "203.0.113.20"
	now := time.Date(2026, 10, 28, 12, 0, 0, 0, time.UTC)
	guard.now = func() time.Time { return now }

	if err := guard.Allow(ctx, LimitScopeAuth, ip, ""); err != nil {
		t.Fatalf("first attempt must be allowed: %v", err)
	}
	requireLimitError(t, guard.Allow(ctx, LimitScopeAuth, ip, ""), "ip")

	now = now.Add(24 * time.Hour)
	if err := guard.Allow(ctx, LimitScopeAuth, ip, ""); err != nil {
		t.Fatalf("next UTC day must reset the counter: %v", err)
	}
}

func TestLimitGuardNilDependenciesAreNoop(t *testing.T) {
	ctx := context.Background()
	if err := NewLimitGuard(nil, "secret").Allow(ctx, LimitScopeMock, "203.0.113.30", "hash"); err != nil {
		t.Fatalf("nil repository must disable the guard: %v", err)
	}
	var guard *LimitGuard
	if err := guard.Allow(ctx, LimitScopeMock, "203.0.113.30", "hash"); err != nil {
		t.Fatalf("nil guard must be a no-op: %v", err)
	}
}

func TestDeviceIDValidationAndHashing(t *testing.T) {
	valid := []string{
		"550e8400-e29b-41d4-a716-446655440000",
		"ABC.def_123:xyz-987",
		"a",
	}
	for _, id := range valid {
		if !ValidDeviceID(id) {
			t.Errorf("ValidDeviceID(%q) = false, want true", id)
		}
	}

	invalid := []string{
		"",
		"contains space",
		"newline\ninjection",
		"<script>",
		"кириллица",
		string(make([]byte, 129)),
	}
	for _, id := range invalid {
		if ValidDeviceID(id) {
			t.Errorf("ValidDeviceID(%q) = true, want false", id)
		}
	}

	hash := HashDeviceID("secret", "device-a")
	if hash == "" || len(hash) != 64 {
		t.Fatalf("device hash = %q, want a 64-char hex digest", hash)
	}
	if hash != HashDeviceID("secret", "device-a") {
		t.Fatal("device hash must be deterministic")
	}
	if hash == HashDeviceID("secret", "device-b") {
		t.Fatal("different devices must map to different hashes")
	}
	if hash == HashDeviceID("other-secret", "device-a") {
		t.Fatal("the hash must depend on the server secret")
	}
}

func TestIsSpeakingQuestionTypeForGuard(t *testing.T) {
	for _, questionType := range SpeakingQuestionTypes {
		if !IsSpeakingQuestionType(questionType) {
			t.Fatalf("%s must consume the speaking allowance", questionType)
		}
	}
	if IsSpeakingQuestionType("READ_SELECT") {
		t.Fatal("reading must not consume the speaking allowance")
	}
}

func TestConsumeWindowIsSharedAndResets(t *testing.T) {
	store := memory.New()
	repo := store.Limits()
	ctx := context.Background()
	window := time.Now().UTC().Truncate(time.Minute)

	for attempt := 1; attempt <= 2; attempt++ {
		used, allowed, err := repo.ConsumeWindow(ctx, "http:/api/v1/auth", "198.51.100.42", window, 2)
		if err != nil || !allowed || used != attempt {
			t.Fatalf("attempt %d: used=%d allowed=%v err=%v", attempt, used, allowed, err)
		}
	}
	used, allowed, err := repo.ConsumeWindow(ctx, "http:/api/v1/auth", "198.51.100.42", window, 2)
	if err != nil || allowed || used != 2 {
		t.Fatalf("limit not enforced: used=%d allowed=%v err=%v", used, allowed, err)
	}

	// A different bucket (route) has its own allowance.
	if _, allowed, _ := repo.ConsumeWindow(ctx, "http:/api/v1/tts", "198.51.100.42", window, 2); !allowed {
		t.Fatal("a different route must not share the counter")
	}

	// The next minute starts from zero.
	next := window.Add(time.Minute)
	if used, allowed, _ := repo.ConsumeWindow(ctx, "http:/api/v1/auth", "198.51.100.42", next, 2); !allowed || used != 1 {
		t.Fatalf("window rollover: used=%d allowed=%v", used, allowed)
	}
}
