package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	sessionCookieName   = "session_token"
	sessionMaxAgeSecond = 60 * 60 * 24 * 30
)

type contextKey string

const userIDContextKey contextKey = "user_id"

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type userResponse struct {
	User user `json:"user"`
}

type user struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

var errMissingSessionToken = errors.New("session token is missing")

func sessionDuration() time.Duration {
	return time.Duration(sessionMaxAgeSecond) * time.Second
}

func generateSessionToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	return hex.EncodeToString(buf), nil
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := readSessionToken(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		userID, err := findActiveSessionUserID(token)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			writeError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		ctx := context.WithValue(r.Context(), userIDContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserIDFromContext(ctx context.Context) (string, bool) {
	value, ok := ctx.Value(userIDContextKey).(string)
	return value, ok
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	username := strings.TrimSpace(req.Username)
	password := req.Password
	if username == "" || password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}

	var dbUser user
	var passwordHash string
	err := db.QueryRow(
		"SELECT id, username, password_hash FROM users WHERE username = $1",
		username,
	).Scan(&dbUser.ID, &dbUser.Username, &passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "invalid username or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}

	token, err := generateSessionToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	expiresAt := time.Now().Add(sessionDuration())
	if _, err := db.Exec(
		"INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
		token, dbUser.ID, expiresAt,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, userResponse{User: dbUser})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	token, err := readSessionToken(r)
	if err == nil {
		if _, execErr := db.Exec("DELETE FROM sessions WHERE token = $1", token); execErr != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete session")
			return
		}
	}

	clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	token, err := readSessionToken(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	dbUser, err := findUserBySessionToken(token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, userResponse{User: dbUser})
}

func findActiveSessionUserID(token string) (string, error) {
	var userID string
	err := db.QueryRow(
		"SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()",
		token,
	).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func findUserBySessionToken(token string) (user, error) {
	var dbUser user
	err := db.QueryRow(
		`SELECT u.id, u.username
		 FROM sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token = $1 AND s.expires_at > NOW()`,
		token,
	).Scan(&dbUser.ID, &dbUser.Username)
	if err != nil {
		return user{}, err
	}
	return dbUser, nil
}

func readSessionToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return "", errMissingSessionToken
		}
		return "", err
	}

	token := strings.TrimSpace(cookie.Value)
	if token == "" {
		return "", errMissingSessionToken
	}

	return token, nil
}

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction() || isCrossOrigin(),
		SameSite: cookieSameSite(),
		MaxAge:   sessionMaxAgeSecond,
		Expires:  time.Now().Add(sessionDuration()),
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction() || isCrossOrigin(),
		SameSite: cookieSameSite(),
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func isProduction() bool {
	return os.Getenv("APP_ENV") == "production"
}

func isCrossOrigin() bool {
	return os.Getenv("CORS_ORIGIN") != ""
}

func cookieSameSite() http.SameSite {
	if isCrossOrigin() {
		return http.SameSiteNoneMode
	}
	return http.SameSiteStrictMode
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
