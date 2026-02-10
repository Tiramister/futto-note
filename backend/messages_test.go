package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
)

func TestListMessagesHandler_UnauthorizedWithoutSession(t *testing.T) {
	router := chi.NewRouter()
	router.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/api/messages", listMessagesHandler)
	})

	request := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, recorder.Code)
	}

	if body := recorder.Body.String(); body != "{\"error\":\"unauthorized\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestCreateMessageHandler_UnauthorizedWithoutSession(t *testing.T) {
	router := chi.NewRouter()
	router.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/api/messages", createMessageHandler)
	})

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/messages",
		strings.NewReader(`{"body":"hello"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, recorder.Code)
	}

	if body := recorder.Body.String(); body != "{\"error\":\"unauthorized\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestCreateMessageHandler_RejectsEmptyBody(t *testing.T) {
	originalInsertMessage := insertMessage
	t.Cleanup(func() {
		insertMessage = originalInsertMessage
	})

	wasCalled := false
	insertMessage = func(userID string, body string) (messageListItem, error) {
		wasCalled = true
		return messageListItem{}, nil
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/messages",
		strings.NewReader(`{"body":""}`),
	)
	request = request.WithContext(context.WithValue(request.Context(), userIDContextKey, "user-1"))

	recorder := httptest.NewRecorder()
	createMessageHandler(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	if wasCalled {
		t.Fatalf("insertMessage should not be called for empty body")
	}

	if body := recorder.Body.String(); body != "{\"error\":\"body is required\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestCreateMessageHandler_CreatesMessageForAuthenticatedUser(t *testing.T) {
	originalInsertMessage := insertMessage
	t.Cleanup(func() {
		insertMessage = originalInsertMessage
	})

	expectedCreatedAt := time.Date(2026, 2, 9, 10, 30, 0, 0, time.UTC)
	gotUserID := ""
	gotBody := ""
	insertMessage = func(userID string, body string) (messageListItem, error) {
		gotUserID = userID
		gotBody = body
		return messageListItem{
			ID:        42,
			Body:      body,
			CreatedAt: expectedCreatedAt,
		}, nil
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/messages",
		strings.NewReader(`{"body":"新規ノート"}`),
	)
	request = request.WithContext(context.WithValue(request.Context(), userIDContextKey, "user-1"))

	recorder := httptest.NewRecorder()
	createMessageHandler(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, recorder.Code)
	}

	if gotUserID != "user-1" {
		t.Fatalf("expected user_id user-1, got %s", gotUserID)
	}

	if gotBody != "新規ノート" {
		t.Fatalf("expected body 新規ノート, got %s", gotBody)
	}

	var response messageListItem
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response.ID != 42 {
		t.Fatalf("expected id 42, got %d", response.ID)
	}

	if response.Body != "新規ノート" {
		t.Fatalf("expected body 新規ノート, got %s", response.Body)
	}

	if !response.CreatedAt.Equal(expectedCreatedAt) {
		t.Fatalf(
			"expected created_at %s, got %s",
			expectedCreatedAt.Format(time.RFC3339),
			response.CreatedAt.Format(time.RFC3339),
		)
	}
}

func TestUpdateMessageHandler_UnauthorizedWithoutSession(t *testing.T) {
	router := chi.NewRouter()
	router.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Put("/api/messages/{id}", updateMessageHandler)
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/1",
		strings.NewReader(`{"body":"updated"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, recorder.Code)
	}

	if body := recorder.Body.String(); body != "{\"error\":\"unauthorized\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestUpdateMessageHandler_RejectsEmptyBody(t *testing.T) {
	originalUpdateMessage := updateMessage
	t.Cleanup(func() {
		updateMessage = originalUpdateMessage
	})

	wasCalled := false
	updateMessage = func(id int, userID string, body string) (messageListItem, error) {
		wasCalled = true
		return messageListItem{}, nil
	}

	router := chi.NewRouter()
	router.Put("/api/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), userIDContextKey, "user-1")
		updateMessageHandler(w, r.WithContext(ctx))
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/1",
		strings.NewReader(`{"body":""}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	if wasCalled {
		t.Fatalf("updateMessage should not be called for empty body")
	}

	if body := recorder.Body.String(); body != "{\"error\":\"body is required\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestUpdateMessageHandler_RejectsInvalidID(t *testing.T) {
	originalUpdateMessage := updateMessage
	t.Cleanup(func() {
		updateMessage = originalUpdateMessage
	})

	wasCalled := false
	updateMessage = func(id int, userID string, body string) (messageListItem, error) {
		wasCalled = true
		return messageListItem{}, nil
	}

	router := chi.NewRouter()
	router.Put("/api/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), userIDContextKey, "user-1")
		updateMessageHandler(w, r.WithContext(ctx))
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/abc",
		strings.NewReader(`{"body":"test"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	if wasCalled {
		t.Fatalf("updateMessage should not be called for invalid id")
	}

	if body := recorder.Body.String(); body != "{\"error\":\"invalid message id\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestUpdateMessageHandler_NotFoundForNonexistentMessage(t *testing.T) {
	originalUpdateMessage := updateMessage
	t.Cleanup(func() {
		updateMessage = originalUpdateMessage
	})

	updateMessage = func(id int, userID string, body string) (messageListItem, error) {
		return messageListItem{}, sql.ErrNoRows
	}

	router := chi.NewRouter()
	router.Put("/api/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), userIDContextKey, "user-1")
		updateMessageHandler(w, r.WithContext(ctx))
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/999",
		strings.NewReader(`{"body":"test"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d", http.StatusNotFound, recorder.Code)
	}

	if body := recorder.Body.String(); body != "{\"error\":\"message not found\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestUpdateMessageHandler_UpdatesMessageForAuthenticatedUser(t *testing.T) {
	originalUpdateMessage := updateMessage
	t.Cleanup(func() {
		updateMessage = originalUpdateMessage
	})

	expectedCreatedAt := time.Date(2026, 2, 9, 10, 30, 0, 0, time.UTC)
	gotID := 0
	gotUserID := ""
	gotBody := ""
	updateMessage = func(id int, userID string, body string) (messageListItem, error) {
		gotID = id
		gotUserID = userID
		gotBody = body
		return messageListItem{
			ID:        id,
			Body:      body,
			CreatedAt: expectedCreatedAt,
		}, nil
	}

	router := chi.NewRouter()
	router.Put("/api/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), userIDContextKey, "user-1")
		updateMessageHandler(w, r.WithContext(ctx))
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/42",
		strings.NewReader(`{"body":"更新されたノート"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}

	if gotID != 42 {
		t.Fatalf("expected id 42, got %d", gotID)
	}

	if gotUserID != "user-1" {
		t.Fatalf("expected user_id user-1, got %s", gotUserID)
	}

	if gotBody != "更新されたノート" {
		t.Fatalf("expected body 更新されたノート, got %s", gotBody)
	}

	var response messageListItem
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response.ID != 42 {
		t.Fatalf("expected id 42, got %d", response.ID)
	}

	if response.Body != "更新されたノート" {
		t.Fatalf("expected body 更新されたノート, got %s", response.Body)
	}

	if !response.CreatedAt.Equal(expectedCreatedAt) {
		t.Fatalf(
			"expected created_at %s, got %s",
			expectedCreatedAt.Format(time.RFC3339),
			response.CreatedAt.Format(time.RFC3339),
		)
	}
}

func TestUpdateMessageHandler_NotFoundForOtherUsersMessage(t *testing.T) {
	originalUpdateMessage := updateMessage
	t.Cleanup(func() {
		updateMessage = originalUpdateMessage
	})

	// user_id が一致しない場合は sql.ErrNoRows が返る（SQLの WHERE user_id = $3 条件）
	gotUserID := ""
	updateMessage = func(id int, userID string, body string) (messageListItem, error) {
		gotUserID = userID
		// user-2 のメッセージを user-1 が更新しようとする場合、
		// WHERE id = $2 AND user_id = $3 の条件に合致しないため ErrNoRows となる
		return messageListItem{}, sql.ErrNoRows
	}

	router := chi.NewRouter()
	router.Put("/api/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
		// リクエストユーザーは user-1（他ユーザー user-2 のメッセージ id=42 を更新しようとする）
		ctx := context.WithValue(r.Context(), userIDContextKey, "user-1")
		updateMessageHandler(w, r.WithContext(ctx))
	})

	request := httptest.NewRequest(
		http.MethodPut,
		"/api/messages/42",
		strings.NewReader(`{"body":"他人のメッセージを更新"}`),
	)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d", http.StatusNotFound, recorder.Code)
	}

	if gotUserID != "user-1" {
		t.Fatalf("expected user_id user-1, got %s", gotUserID)
	}

	if body := recorder.Body.String(); body != "{\"error\":\"message not found\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}
