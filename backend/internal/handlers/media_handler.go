package handlers

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type MediaHandler struct {
	catService *service.CATService
	uploadDir  string
}

func NewMediaHandler(catService *service.CATService, uploadDir string) *MediaHandler {
	if uploadDir == "" {
		uploadDir = "data/media/audio"
	}
	_ = os.MkdirAll(uploadDir, 0755)
	return &MediaHandler{
		catService: catService,
		uploadDir:  uploadDir,
	}
}

// UploadAudio handles audio file uploads from MediaRecorder for Speaking tasks.
// POST /api/v1/test/sessions/{id}/audio
func (h *MediaHandler) UploadAudio(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "Missing session ID")
		return
	}

	// 25MB limit on audio upload
	r.Body = http.MaxBytesReader(w, r.Body, 25<<20)
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		RespondError(w, http.StatusBadRequest, "File size exceeds 25MB limit")
		return
	}

	file, fileHeader, err := r.FormFile("audio")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Missing 'audio' file field in multipart request")
		return
	}
	defer file.Close()

	questionID := r.FormValue("questionId")
	transcript := strings.TrimSpace(r.FormValue("transcript"))
	var durationSec float64
	if durStr := r.FormValue("durationSec"); durStr != "" {
		if d, err := strconv.ParseFloat(durStr, 64); err == nil {
			durationSec = d
		}
	}

	// Determine file extension and MIME type
	contentType := fileHeader.Header.Get("Content-Type")
	ext := ".webm"
	switch {
	case strings.Contains(contentType, "wav"):
		ext = ".wav"
	case strings.Contains(contentType, "mp4") || strings.Contains(contentType, "m4a"):
		ext = ".m4a"
	case strings.Contains(contentType, "ogg"):
		ext = ".ogg"
	case strings.Contains(contentType, "mp3") || strings.Contains(contentType, "mpeg"):
		ext = ".mp3"
	}

	assetID := uuid.New().String()
	cleanFilename := fmt.Sprintf("%s_%s_%s%s", sessionID, questionID, assetID[:8], ext)
	targetPath := filepath.Join(h.uploadDir, cleanFilename)

	dst, err := os.Create(targetPath)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to save audio file on server")
		return
	}
	defer dst.Close()

	writtenBytes, err := io.Copy(dst, file)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to write audio stream")
		return
	}

	if writtenBytes == 0 {
		_ = os.Remove(targetPath)
		RespondError(w, http.StatusBadRequest, "Uploaded audio file is empty (0 bytes)")
		return
	}

	audioURL := fmt.Sprintf("/api/v1/media/audio/%s", cleanFilename)

	asset := &models.MediaAsset{
		ID:          assetID,
		UserID:      userID,
		SessionID:   sessionID,
		QuestionID:  questionID,
		FileType:    contentType,
		FilePath:    targetPath,
		URL:         audioURL,
		FileSize:    writtenBytes,
		DurationSec: durationSec,
		CreatedAt:   time.Now().UTC(),
	}

	// Save media asset and evaluate speaking if questionId provided
	eval, err := h.catService.RecordAudioResponse(r.Context(), sessionID, userID, questionID, audioURL, transcript, durationSec, writtenBytes, asset)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"asset":      asset,
		"url":        audioURL,
		"evaluation": eval,
	})
}

// ServeAudio streams the recorded student audio with HTTP Range support.
// GET /api/v1/media/audio/{filename}
func (h *MediaHandler) ServeAudio(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	if filename == "" {
		RespondError(w, http.StatusBadRequest, "Missing filename")
		return
	}

	// Prevent directory traversal attacks
	cleanFilename := filepath.Base(filename)
	filePath := filepath.Join(h.uploadDir, cleanFilename)

	info, err := os.Stat(filePath)
	if err != nil || info.IsDir() {
		RespondError(w, http.StatusNotFound, "Audio file not found")
		return
	}

	// Content-Type based on extension
	ext := strings.ToLower(filepath.Ext(cleanFilename))
	switch ext {
	case ".webm":
		w.Header().Set("Content-Type", "audio/webm")
	case ".wav":
		w.Header().Set("Content-Type", "audio/wav")
	case ".ogg":
		w.Header().Set("Content-Type", "audio/ogg")
	case ".m4a":
		w.Header().Set("Content-Type", "audio/mp4")
	case ".mp3":
		w.Header().Set("Content-Type", "audio/mpeg")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "private, max-age=86400")

	http.ServeFile(w, r, filePath)
}

func minF(a, b float64) float64 {
	return math.Min(a, b)
}
