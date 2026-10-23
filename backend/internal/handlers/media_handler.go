package handlers

import (
	"errors"
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
	// Authorize before touching the filesystem. Otherwise an attacker can
	// fill the disk using someone else's or a non-existent session.
	if err := h.catService.VerifySessionOwner(r.Context(), sessionID, userID); err != nil {
		RespondError(w, http.StatusForbidden, "Session does not belong to user")
		return
	}

	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		RespondError(w, http.StatusInternalServerError, "Media storage is unavailable")
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
	// The public filename is derived only from a server-generated UUID. Never
	// build a filesystem path from sessionID/questionID supplied by a client.
	cleanFilename := assetID + ext
	targetPath := filepath.Join(h.uploadDir, cleanFilename)

	tmpFile, err := os.CreateTemp(h.uploadDir, "upload-*")
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to save audio file on server")
		return
	}
	tmpPath := tmpFile.Name()
	cleanupTemp := func() {
		_ = tmpFile.Close()
		_ = os.Remove(tmpPath)
	}

	writtenBytes, err := io.Copy(tmpFile, file)
	if err != nil {
		cleanupTemp()
		RespondError(w, http.StatusInternalServerError, "Failed to write audio stream")
		return
	}
	if err := tmpFile.Sync(); err != nil {
		cleanupTemp()
		RespondError(w, http.StatusInternalServerError, "Failed to flush audio file")
		return
	}
	if err := tmpFile.Close(); err != nil {
		_ = os.Remove(tmpPath)
		RespondError(w, http.StatusInternalServerError, "Failed to close audio file")
		return
	}
	if writtenBytes == 0 {
		_ = os.Remove(tmpPath)
		RespondError(w, http.StatusBadRequest, "Uploaded audio file is empty (0 bytes)")
		return
	}
	if err := os.Rename(tmpPath, targetPath); err != nil {
		_ = os.Remove(tmpPath)
		RespondError(w, http.StatusInternalServerError, "Failed to finalize audio file")
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
		_ = os.Remove(targetPath)
		if errors.Is(err, service.ErrQuestionAlreadyAnswered) {
			RespondError(w, http.StatusConflict, err.Error())
			return
		}
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
// The route is authenticated and ownership is checked against media_assets.
// GET /api/v1/media/audio/{filename}
func (h *MediaHandler) ServeAudio(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	filename := chi.URLParam(r, "filename")
	if filename == "" {
		RespondError(w, http.StatusBadRequest, "Missing filename")
		return
	}
	cleanFilename := filepath.Base(filename)
	assetID := strings.TrimSuffix(cleanFilename, filepath.Ext(cleanFilename))
	asset, err := h.catService.GetMediaAssetForUser(r.Context(), assetID, userID)
	if err != nil || asset == nil {
		RespondError(w, http.StatusNotFound, "Audio file not found")
		return
	}

	filePath := asset.FilePath
	info, err := os.Stat(filePath)
	if err != nil || info.IsDir() {
		RespondError(w, http.StatusNotFound, "Audio file not found")
		return
	}

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
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "private, no-store")

	http.ServeFile(w, r, filePath)
}

func minF(a, b float64) float64 {
	return math.Min(a, b)
}

// DeleteSessionAudio removes the audio recordings of an attempt. The rows are
// deleted first; files are removed only when they live inside the upload
// directory, so a corrupt path can never delete an unrelated file.
func (h *MediaHandler) DeleteSessionAudio(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	sessionID := chi.URLParam(r, "sessionId")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	paths, err := h.catService.DeleteSessionAudioAssets(r.Context(), sessionID, userID)
	if err != nil {
		RespondError(w, http.StatusForbidden, "Session does not belong to user")
		return
	}

	root := filepath.Clean(h.uploadDir)
	deletedFiles := 0
	for _, path := range paths {
		clean := filepath.Clean(path)
		if !strings.HasPrefix(clean, root+string(os.PathSeparator)) {
			continue
		}
		if err := os.Remove(clean); err == nil {
			deletedFiles++
		}
	}

	RespondJSON(w, http.StatusOK, map[string]int{
		"deletedAssets": len(paths),
		"deletedFiles":  deletedFiles,
	})
}
