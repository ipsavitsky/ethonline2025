package app

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"

	"watson/internal/auth"
)

type App struct {
	DB         *sql.DB
	RPC        *ethclient.Client
	Domain     string
	OriginURI  string
	ChainID    int64
	CookieName string
	NonceTTL   time.Duration
	SessTTL    time.Duration
}

func (a *App) Routes(mux *http.ServeMux) {
	mux.HandleFunc("POST /auth/nonce", a.handleNonce)
	mux.HandleFunc("POST /auth/verify", a.handleVerify)
	mux.HandleFunc("GET /me", a.handleMe)
	mux.HandleFunc("POST /auth/logout", a.handleLogout)
}

// ---------- Handlers ----------

type nonceReq struct {
	Address string `json:"address"`
	ChainID int64  `json:"chainId"`
	Origin  string `json:"origin"`
}
type nonceRes struct {
	Nonce     string    `json:"nonce"`
	Message   string    `json:"message"`
	ExpiresAt time.Time `json:"expiresAt"`
}

func (a *App) handleNonce(w http.ResponseWriter, r *http.Request) {
	var req nonceReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpErr(w, 400, "bad json")
		return
	}
	if req.ChainID != a.ChainID {
		httpErr(w, 400, "wrong chainId")
		return
	}
	if !strings.HasPrefix(req.Origin, a.OriginURI) {
		httpErr(w, 400, "wrong origin")
		return
	}

	nonce := randHex(16)
	expires := time.Now().Add(a.NonceTTL).UTC()
	if _, err := a.DB.Exec(`INSERT INTO auth_nonces (nonce, expires_at) VALUES (?, ?)`, nonce, expires); err != nil {
		httpErr(w, 500, "db")
		return
	}
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expAt := expires.Format(time.RFC3339)
	msg := auth.BuildSiweString(a.Domain, req.Address, a.OriginURI, "1", a.ChainID, nonce, issuedAt, expAt, "")

	writeJSON(w, 200, nonceRes{Nonce: nonce, Message: msg, ExpiresAt: expires})
}

type verifyReq struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}

func (a *App) handleVerify(w http.ResponseWriter, r *http.Request) {
	var req verifyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpErr(w, 400, "bad json")
		return
	}

	parsed, err := auth.ParseSiwe(req.Message)
	if err != nil {
		httpErr(w, 400, "bad siwe")
		return
	}
	if strings.TrimSpace(parsed.Domain) != a.Domain {
		httpErr(w, 400, "domain mismatch")
		return
	}
	if strings.TrimSpace(parsed.URI) != a.OriginURI {
		httpErr(w, 400, "uri mismatch")
		return
	}
	if parsed.ChainID != a.ChainID {
		httpErr(w, 400, "chainId mismatch")
		return
	}

	var used int
	var exp time.Time
	err = a.DB.QueryRow(`SELECT used, expires_at FROM auth_nonces WHERE nonce = ?`, parsed.Nonce).Scan(&used, &exp)
	if errors.Is(err, sql.ErrNoRows) || used != 0 || time.Now().After(exp) {
		httpErr(w, 400, "invalid nonce")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	hash := auth.EIP191Hash(req.Message)
	addr := common.HexToAddress(parsed.Address)
	isContract, err := auth.IsContract(a.RPC, addr)
	if err != nil {
		httpErr(w, 500, "rpc")
		return
	}

	ok := false
	if isContract {
		ok, err = auth.VerifyERC1271(a.RPC, addr, hash, req.Signature)
	} else {
		ok, err = auth.VerifyEOA(hash, req.Signature, addr)
	}
	if err != nil || !ok {
		httpErr(w, 401, "signature invalid")
		return
	}

	if _, err := a.DB.Exec(`UPDATE auth_nonces SET used = 1 WHERE nonce = ?`, parsed.Nonce); err != nil {
		httpErr(w, 500, "db")
		return
	}

	sid := uuid.NewString()
	expAt := time.Now().Add(a.SessTTL).UTC()
	if _, err := a.DB.Exec(`INSERT INTO sessions (sid, address, expires_at) VALUES (?,?,?)`,
		sid, strings.ToLower(addr.Hex()), expAt); err != nil {
		httpErr(w, 500, "db")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     a.CookieName,
		Value:    sid,
		Path:     "/",
		Expires:  expAt,
		MaxAge:   int(a.SessTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
	w.WriteHeader(204)
}

func (a *App) handleMe(w http.ResponseWriter, r *http.Request) {
	sid, ok := readSID(r, a.CookieName)
	if !ok {
		httpErr(w, 401, "no session")
		return
	}
	var address string
	var exp time.Time
	err := a.DB.QueryRow(`SELECT address, expires_at FROM sessions WHERE sid = ?`, sid).Scan(&address, &exp)
	if errors.Is(err, sql.ErrNoRows) || time.Now().After(exp) {
		httpErr(w, 401, "expired")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}
	writeJSON(w, 200, map[string]string{"address": address})
}

func (a *App) handleLogout(w http.ResponseWriter, r *http.Request) {
	sid, ok := readSID(r, a.CookieName)
	if ok {
		a.DB.Exec(`DELETE FROM sessions WHERE sid = ?`, sid)
	}
	http.SetCookie(w, &http.Cookie{
		Name: a.CookieName, Value: "", Path: "/", MaxAge: -1,
		HttpOnly: true, Secure: true, SameSite: http.SameSiteStrictMode,
	})
	w.WriteHeader(204)
}

// ---------- helpers ----------
func randHex(n int) string { b := make([]byte, n); _, _ = rand.Read(b); return hex.EncodeToString(b) }
func writeJSON(w http.ResponseWriter, code int, v any) {
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
func httpErr(w http.ResponseWriter, code int, msg string) {
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
func readSID(r *http.Request, name string) (string, bool) {
	c, err := r.Cookie(name)
	if err != nil {
		return "", false
	}
	return c.Value, true
}

// tiny env sugar (чтобы main.go не пух)
func EnvOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
