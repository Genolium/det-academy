package email

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"time"
)

// PostboxSender delivers mail through the Yandex Cloud Postbox HTTPS API
// (Amazon SES v2 compatible, Signature Version 4). It exists because some
// hosting providers block outbound SMTP ports; 443 usually remains open.
type PostboxSender struct {
	AccessKey string
	SecretKey string
	Region    string
	Endpoint  string
	From      string
	Client    *http.Client
}

func (s *PostboxSender) endpoint() string {
	if strings.TrimSpace(s.Endpoint) != "" {
		return strings.TrimRight(s.Endpoint, "/")
	}
	return "https://postbox.cloud.yandex.net"
}

func (s *PostboxSender) region() string {
	if strings.TrimSpace(s.Region) != "" {
		return s.Region
	}
	return "ru-central1"
}

func (s *PostboxSender) timeout() time.Duration {
	if s.Client != nil && s.Client.Timeout > 0 {
		return s.Client.Timeout
	}
	return 10 * time.Second
}

// Check only validates configuration. The HTTPS path has no separate port to
// probe; authentication errors surface on the first Send.
func (s *PostboxSender) Check(context.Context) error {
	if s.AccessKey == "" || s.SecretKey == "" {
		return errors.New("postbox: access key and secret are required")
	}
	return nil
}

type postboxRequest struct {
	FromEmailAddress string `json:"FromEmailAddress"`
	Destination      struct {
		ToAddresses []string `json:"ToAddresses"`
	} `json:"Destination"`
	Content struct {
		Simple struct {
			Subject struct {
				Data    string `json:"Data"`
				Charset string `json:"Charset"`
			} `json:"Subject"`
			Body struct {
				Text *postboxBody `json:"Text,omitempty"`
				HTML *postboxBody `json:"Html,omitempty"`
			} `json:"Body"`
		} `json:"Simple"`
	} `json:"Content"`
}

type postboxBody struct {
	Data    string `json:"Data"`
	Charset string `json:"Charset"`
}

func (s *PostboxSender) Send(ctx context.Context, msg Message) error {
	if s.AccessKey == "" || s.SecretKey == "" {
		return errors.New("postbox: access key and secret are required")
	}
	from, err := senderAddress(s.From)
	if err != nil {
		return fmt.Errorf("postbox: invalid sender: %w", err)
	}
	to, err := mail.ParseAddress(msg.To)
	if err != nil {
		return fmt.Errorf("postbox: invalid recipient: %w", err)
	}

	payload := postboxRequest{FromEmailAddress: from}
	payload.Destination.ToAddresses = []string{to.Address}
	payload.Content.Simple.Subject.Data = msg.Subject
	payload.Content.Simple.Subject.Charset = "UTF-8"
	if msg.HTML != "" {
		payload.Content.Simple.Body.HTML = &postboxBody{Data: msg.HTML, Charset: "UTF-8"}
	}
	text := stripHTML(msg.HTML)
	if text == "" {
		text = msg.Subject
	}
	payload.Content.Simple.Body.Text = &postboxBody{Data: text, Charset: "UTF-8"}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("postbox: marshal: %w", err)
	}

	endpoint := s.endpoint()
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return fmt.Errorf("postbox: invalid endpoint: %w", err)
	}
	path := strings.TrimRight(parsed.Path, "/") + "/v2/email/outbound-emails"

	now := time.Now().UTC()
	headers, err := signPostboxRequest(s.AccessKey, s.SecretKey, s.region(), parsed.Host, path, body, now)
	if err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint+path, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("postbox: request: %w", err)
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}

	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: s.timeout()}
	}
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("postbox: send: %w", err)
	}
	defer response.Body.Close()
	responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("postbox: HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}
	return nil
}

func (s *PostboxSender) SendVerification(ctx context.Context, to, link string) error {
	return s.Send(ctx, Message{To: to, Subject: "Подтвердите email в DET Academy", HTML: verificationHTML(link)})
}

func signPostboxRequest(accessKey, secretKey, region, host, path string, payload []byte, now time.Time) (map[string]string, error) {
	const service = "ses"
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")
	payloadHash := sha256Hex(payload)

	signedHeaders := "content-type;host;x-amz-date"
	canonicalHeaders := "content-type:application/json\nhost:" + host + "\nx-amz-date:" + amzDate + "\n"
	canonicalRequest := strings.Join([]string{
		http.MethodPost,
		path,
		"",
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	scope := dateStamp + "/" + region + "/" + service + "/aws4_request"
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		scope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")

	dateKey := hmacSHA256([]byte("AWS4"+secretKey), dateStamp)
	regionKey := hmacSHA256(dateKey, region)
	serviceKey := hmacSHA256(regionKey, service)
	signingKey := hmacSHA256(serviceKey, "aws4_request")
	signature := hex.EncodeToString(hmacSHA256(signingKey, stringToSign))

	authorization := fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey, scope, signedHeaders, signature,
	)
	return map[string]string{
		"Content-Type":  "application/json",
		"X-Amz-Date":    amzDate,
		"Authorization": authorization,
	}, nil
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write([]byte(data))
	return mac.Sum(nil)
}

func stripHTML(value string) string {
	replacer := strings.NewReplacer("<br>", "\n", "<br/>", "\n", "</p>", "\n")
	text := replacer.Replace(value)
	var builder strings.Builder
	inTag := false
	for _, char := range text {
		switch char {
		case '<':
			inTag = true
		case '>':
			inTag = false
		default:
			if !inTag {
				builder.WriteRune(char)
			}
		}
	}
	return strings.TrimSpace(builder.String())
}
