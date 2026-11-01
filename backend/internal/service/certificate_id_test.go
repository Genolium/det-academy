package service

import (
	"strings"
	"testing"
)

func TestCertificateIDIsUnguessable(t *testing.T) {
	first := newCertificateID()
	second := newCertificateID()
	if first == second {
		t.Fatal("certificate ids must not repeat")
	}
	if !strings.HasPrefix(first, "det-cert-") {
		t.Fatalf("unexpected prefix: %s", first)
	}
	if len(first) != len("det-cert-")+32 {
		t.Fatalf("certificate id must carry 128 random bits, got %d chars: %s", len(first), first)
	}
}
