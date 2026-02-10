package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type messageListItem struct {
	ID        int       `json:"id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

type messageListResponse struct {
	Messages []messageListItem `json:"messages"`
}

type createMessageRequest struct {
	Body string `json:"body"`
}

type updateMessageRequest struct {
	Body string `json:"body"`
}

var insertMessage = func(userID string, body string) (messageListItem, error) {
	var message messageListItem
	err := db.QueryRow(
		`INSERT INTO messages (user_id, body)
		 VALUES ($1, $2)
		 RETURNING id, body, created_at`,
		userID,
		body,
	).Scan(&message.ID, &message.Body, &message.CreatedAt)
	if err != nil {
		return messageListItem{}, err
	}

	return message, nil
}

var updateMessage = func(id int, userID string, body string) (messageListItem, error) {
	var message messageListItem
	err := db.QueryRow(
		`UPDATE messages
		 SET body = $1
		 WHERE id = $2 AND user_id = $3
		 RETURNING id, body, created_at`,
		body,
		id,
		userID,
	).Scan(&message.ID, &message.Body, &message.CreatedAt)
	if err != nil {
		return messageListItem{}, err
	}

	return message, nil
}

func listMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	rows, err := db.Query(
		`SELECT id, body, created_at
		 FROM messages
		 WHERE user_id = $1
		 ORDER BY created_at ASC`,
		userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer rows.Close()

	messages := make([]messageListItem, 0)
	for rows.Next() {
		var message messageListItem
		if err := rows.Scan(&message.ID, &message.Body, &message.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		messages = append(messages, message)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, messageListResponse{Messages: messages})
}

func createMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var req createMessageRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Body == "" {
		writeError(w, http.StatusBadRequest, "body is required")
		return
	}

	message, err := insertMessage(userID, req.Body)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusCreated, message)
}

func updateMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	idParam := chi.URLParam(r, "id")
	messageID, err := strconv.Atoi(idParam)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid message id")
		return
	}

	var req updateMessageRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Body == "" {
		writeError(w, http.StatusBadRequest, "body is required")
		return
	}

	message, err := updateMessage(messageID, userID, req.Body)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "message not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, message)
}
