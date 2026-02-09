package main

import (
	"context"
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
