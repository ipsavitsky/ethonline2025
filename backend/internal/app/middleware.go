package app

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"os"
	"time"
)

type contextKey string

const addressKey contextKey = "address"

// authMiddleware checks if user is authenticated via session cookie
func (a *App) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sid, ok := readSID(r, a.CookieName)
		if !ok {
			httpErr(w, 401, "Not authenticated")
			return
		}

		var address string
		var exp time.Time
		err := a.DB.QueryRow(`SELECT address, expires_at FROM sessions WHERE sid = ?`, sid).Scan(&address, &exp)
		if errors.Is(err, sql.ErrNoRows) || time.Now().After(exp) {
			httpErr(w, 401, "Not authenticated")
			return
		}
		if err != nil {
			httpErr(w, 500, "db")
			return
		}

		// Add address to request context
		ctx := context.WithValue(r.Context(), addressKey, address)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// getAuthAddress extracts the authenticated address from request context
func getAuthAddress(r *http.Request) (string, bool) {
	addr, ok := r.Context().Value(addressKey).(string)
	return addr, ok
}

// WithJSON sets JSON content type header
func WithJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// WithSecurityHeaders adds security headers and CORS support
func WithSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := EnvOr("CORS_ORIGIN", "http://localhost:3000")

		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Cookie")

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// EnvOr returns the environment variable value or default
func EnvOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
