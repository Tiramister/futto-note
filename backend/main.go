package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	var err error
	db, err = connectDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/api/health", healthHandler)
	r.Post("/api/login", loginHandler)
	r.Post("/api/logout", logoutHandler)
	r.Get("/api/me", meHandler)
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/api/messages", listMessagesHandler)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func connectDB() (*sql.DB, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	return conn, nil
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	var result int
	err := db.QueryRow("SELECT 1").Scan(&result)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status":  "error",
			"message": "database connection failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}
