package service

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"det-academy-backend/internal/email"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"

	"github.com/google/uuid"
)

// DigestService sends the weekly learning summary once per user and week.
// The idempotency key lives in learning_events, so a restart or a second
// replica cannot send the same week twice.
type DigestService struct {
	storage repository.Storage
	study   *StudyService
	sender  email.Sender
}

func NewDigestService(storage repository.Storage, study *StudyService, sender email.Sender) *DigestService {
	return &DigestService{storage: storage, study: study, sender: sender}
}

func (d *DigestService) enabled() bool {
	return strings.ToLower(strings.TrimSpace(os.Getenv("DIGEST_ENABLED"))) == "true"
}

// Run waits for the weekly window and sends the digest. It is a no-op unless
// DIGEST_ENABLED=true, which keeps local tests and CI free of email side
// effects.
func (d *DigestService) Run(ctx context.Context) {
	if d == nil || !d.enabled() {
		return
	}
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for {
		now := time.Now().UTC()
		if now.Weekday() == time.Monday && now.Hour() >= 9 {
			if sent, skipped, err := d.SendWeekly(ctx, false); err != nil {
				log.Printf("[digest] weekly run failed: %v", err)
			} else {
				log.Printf("[digest] weekly run: sent=%d skipped=%d", sent, skipped)
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// SendWeekly sends one digest per verified user. A dry run renders and counts
// the messages without calling the transport.
func (d *DigestService) SendWeekly(ctx context.Context, dryRun bool) (sent, skipped int, err error) {
	if d == nil || d.study == nil {
		return 0, 0, fmt.Errorf("digest service is not configured")
	}
	if !dryRun && d.sender == nil {
		return 0, 0, fmt.Errorf("email transport is not configured")
	}
	if !dryRun {
		// A blocked SMTP port must fail once, not once per recipient.
		if checker, ok := d.sender.(interface{ Check(context.Context) error }); ok {
			if checkErr := checker.Check(ctx); checkErr != nil {
				return 0, 0, fmt.Errorf("email transport unreachable: %w", checkErr)
			}
		}
	}
	users, _, listErr := d.storage.Users().ListAll(ctx, 1, 1000, "", "")
	if listErr != nil {
		return 0, 0, listErr
	}
	week := weekStart(time.Now().UTC())
	key := "weekly-digest-" + week.Format("2006-01-02")

	for _, user := range users {
		if user.Email == "" || !user.EmailVerified {
			skipped++
			continue
		}
		digestEnabled, preferenceErr := d.storage.Users().GetEmailDigestEnabled(ctx, user.ID)
		if preferenceErr != nil {
			skipped++
			continue
		}
		if !digestEnabled {
			skipped++
			continue
		}
		report, reportErr := d.study.GetWeeklyReport(ctx, user.ID)
		if reportErr != nil || (report.StudyDays == 0 && report.Sessions == 0) {
			skipped++
			continue
		}
		if !dryRun {
			// Claim the week before sending. A concurrent replica or a restart
			// loses the insert and skips, so the same week is never sent twice.
			claimed, claimErr := d.storage.Study().RecordLearningEvent(ctx, &models.LearningEvent{
				ID: uuid.NewString(), UserID: user.ID, EventType: "weekly_digest",
				IdempotencyKey: key, CreatedAt: time.Now().UTC(),
			})
			if claimErr != nil {
				log.Printf("[digest] claim for %s failed: %v", user.ID, claimErr)
				skipped++
				continue
			}
			if !claimed {
				skipped++
				continue
			}
		}
		unsubscribeURL := fmt.Sprintf("%s/api/v1/email/unsubscribe?token=%s", email.PublicAppURL(), DigestUnsubscribeToken(user.ID))
		subject, html := digestMessage(user, report, week, unsubscribeURL)
		if !dryRun {
			if sendErr := d.sender.Send(ctx, email.Message{To: user.Email, Subject: subject, HTML: html}); sendErr != nil {
				// The claim stays: a retry loop must not spam a broken address.
				log.Printf("[digest] send to %s failed: %v", user.ID, sendErr)
				skipped++
				continue
			}
		}
		sent++
	}
	return sent, skipped, nil
}

func weekStart(now time.Time) time.Time {
	offset := (int(now.Weekday()) + 6) % 7 // Monday = 0
	day := now.AddDate(0, 0, -offset)
	return time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.UTC)
}

func digestMessage(user models.User, report *models.WeeklyReport, week time.Time, unsubscribeURL string) (string, string) {
	name := user.Name
	if strings.TrimSpace(name) == "" {
		name = "Student"
	}
	weakest := report.WeakestSkill
	if weakest == "" {
		weakest = "not measured yet"
	}
	recommendation := "Take a mock this week to keep the estimate current."
	if len(report.Recommendations) > 0 {
		recommendation = report.Recommendations[0]
	}
	subject := fmt.Sprintf("DET Academy: your week of %s", week.Format("02 Jan"))
	html := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
  <h1 style="font-size:22px">Your week at DET Academy</h1>
  <p>Hi %s,</p>
  <ul>
    <li>Study days: <strong>%d</strong></li>
    <li>Mock tests: <strong>%d</strong></li>
    <li>SRS reviews: <strong>%d</strong></li>
    <li>Current estimate: <strong>%d–%d</strong></li>
    <li>Weakest skill: <strong>%s</strong></li>
  </ul>
  <p><strong>Next step:</strong> %s</p>
  <p><a href="https://det-academy.ru/practice/adaptive">Open adaptive practice</a></p>
  <p style="color:#666;font-size:12px">You receive this weekly summary because you have a verified DET Academy account. <a href="%s">Unsubscribe from weekly summaries</a>.</p>
</div>`, name, report.StudyDays, report.MockTests, report.SRSReviews, report.RangeLow, report.RangeHigh, weakest, recommendation, unsubscribeURL)
	return subject, html
}
