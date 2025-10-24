package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"

	"watson/internal/app"
	"watson/internal/db"
)

func mustInt64(k string) int64 {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing env %s", k)
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		log.Fatalf("bad %s: %v", k, err)
	}
	return n
}
func must(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing env %s", k)
	}
	return v
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	dsn := app.EnvOr("SQLITE_DSN", "file:app.db?_foreign_keys=on&_busy_timeout=5000")
	sql := db.MustOpenSQLite(dsn)
	defer sql.Close()
	db.MustMigrate(sql)

	rpcURL := must("RPC_URL")
	rpc, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatalf("ethclient: %v", err)
	}

	a := &app.App{
		DB:         sql,
		RPC:        rpc,
		Domain:     must("SIWE_DOMAIN"),
		OriginURI:  must("SIWE_ORIGIN"),
		ChainID:    mustInt64("SIWE_CHAIN_ID"),
		CookieName: app.EnvOr("COOKIE_NAME", "sid"),
		NonceTTL:   parseDur("NONCE_TTL", 5*time.Minute),
		SessTTL:    parseDur("SESSION_TTL", 15*time.Minute),
	}

	mux := http.NewServeMux()
	a.Routes(mux)

	addr := app.EnvOr("ADDR", ":8080")
	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, app.WithJSON(app.WithSecurityHeaders(mux))))
}

func parseDur(k string, def time.Duration) time.Duration {
	if v := os.Getenv(k); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}
