package main

import (
	"net/http"
	"time"
)

type messageListItem struct {
	ID        int       `json:"id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

type messageListResponse struct {
	Messages []messageListItem `json:"messages"`
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
