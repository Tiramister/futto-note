package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

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
