package app

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Audit represents a security audit
type Audit struct {
	ID              string         `json:"id"`
	OwnerAddress    string         `json:"owner_address"`
	Name            string         `json:"name"`
	Description     string         `json:"description,omitempty"`
	Status          string         `json:"status"`
	ContractAddress string         `json:"contract_address,omitempty"`
	Blockchain      string         `json:"blockchain"`
	GitHubURL       string         `json:"github_url,omitempty"`
	SourceCode      string         `json:"source_code,omitempty"`
	AgentsUsed      []string       `json:"agents_used,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	StartedAt       *time.Time     `json:"started_at,omitempty"`
	CompletedAt     *time.Time     `json:"completed_at,omitempty"`
	FindingsCount   *FindingsCount `json:"findings_count,omitempty"`
}

// FindingsCount represents count of findings by severity
type FindingsCount struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
	Info     int `json:"info"`
}

// CreateAuditRequest represents the request to create an audit
type CreateAuditRequest struct {
	Name            string   `json:"name"`
	Description     string   `json:"description"`
	ContractAddress string   `json:"contract_address"`
	Blockchain      string   `json:"blockchain"`
	GitHubURL       string   `json:"github_url"`
	SourceCode      string   `json:"source_code"`
	Agents          []string `json:"agents"`
}

// handleGetAudits returns all audits for the authenticated user
func (a *App) handleGetAudits(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Parse query parameters
	status := r.URL.Query().Get("status")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Build query
	query := `
		SELECT id, owner_address, name, description, status, contract_address, blockchain, 
		       github_url, created_at, updated_at, started_at, completed_at
		FROM audits
		WHERE owner_address = ?`
	args := []interface{}{address}

	if status != "" {
		query += ` AND status = ?`
		args = append(args, status)
	}

	query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	rows, err := a.DB.Query(query, args...)
	if err != nil {
		httpErr(w, 500, "db")
		return
	}
	defer rows.Close()

	audits := []Audit{}
	for rows.Next() {
		var audit Audit
		var desc, contractAddr, githubURL sql.NullString
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&audit.ID,
			&audit.OwnerAddress,
			&audit.Name,
			&desc,
			&audit.Status,
			&contractAddr,
			&audit.Blockchain,
			&githubURL,
			&audit.CreatedAt,
			&audit.UpdatedAt,
			&startedAt,
			&completedAt,
		)
		if err != nil {
			httpErr(w, 500, "scan")
			return
		}

		if desc.Valid {
			audit.Description = desc.String
		}
		if contractAddr.Valid {
			audit.ContractAddress = contractAddr.String
		}
		if githubURL.Valid {
			audit.GitHubURL = githubURL.String
		}
		if startedAt.Valid {
			audit.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			audit.CompletedAt = &completedAt.Time
		}

		// Get findings count
		findingsCount := a.getFindingsCount(audit.ID)
		audit.FindingsCount = findingsCount

		audits = append(audits, audit)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM audits WHERE owner_address = ?`
	countArgs := []interface{}{address}
	if status != "" {
		countQuery += ` AND status = ?`
		countArgs = append(countArgs, status)
	}

	var total int
	err = a.DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"audits": audits,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// handleGetAudit returns a specific audit by ID
func (a *App) handleGetAudit(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Extract ID from path: /audits/{id}
	id := r.PathValue("id")
	if id == "" {
		httpErr(w, 400, "missing audit ID")
		return
	}

	var audit Audit
	var desc, contractAddr, githubURL, sourceCode, agentsJSON sql.NullString
	var startedAt, completedAt sql.NullTime

	err := a.DB.QueryRow(`
		SELECT id, owner_address, name, description, status, contract_address, blockchain,
		       github_url, source_code, agents_used, created_at, updated_at, started_at, completed_at
		FROM audits
		WHERE id = ?
	`, id).Scan(
		&audit.ID,
		&audit.OwnerAddress,
		&audit.Name,
		&desc,
		&audit.Status,
		&contractAddr,
		&audit.Blockchain,
		&githubURL,
		&sourceCode,
		&agentsJSON,
		&audit.CreatedAt,
		&audit.UpdatedAt,
		&startedAt,
		&completedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		httpErr(w, 404, "Audit not found")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	// Check ownership
	if audit.OwnerAddress != address {
		httpErr(w, 404, "Audit not found")
		return
	}

	if desc.Valid {
		audit.Description = desc.String
	}
	if contractAddr.Valid {
		audit.ContractAddress = contractAddr.String
	}
	if githubURL.Valid {
		audit.GitHubURL = githubURL.String
	}
	if sourceCode.Valid {
		audit.SourceCode = sourceCode.String
	}
	if startedAt.Valid {
		audit.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		audit.CompletedAt = &completedAt.Time
	}

	// Parse agents JSON
	if agentsJSON.Valid && agentsJSON.String != "" {
		if err := json.Unmarshal([]byte(agentsJSON.String), &audit.AgentsUsed); err != nil {
			audit.AgentsUsed = []string{}
		}
	} else {
		audit.AgentsUsed = []string{}
	}

	writeJSON(w, 200, audit)
}

// handleCreateAudit creates a new audit
func (a *App) handleCreateAudit(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	var req CreateAuditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpErr(w, 400, "bad json")
		return
	}

	// Validation
	req.Name = strings.TrimSpace(req.Name)
	req.Blockchain = strings.TrimSpace(req.Blockchain)
	req.GitHubURL = strings.TrimSpace(req.GitHubURL)
	req.ContractAddress = strings.TrimSpace(req.ContractAddress)

	if req.Name == "" || len(req.Name) > 200 {
		httpErr(w, 400, "name must be 1-200 characters")
		return
	}

	if req.Blockchain == "" {
		httpErr(w, 400, "blockchain is required")
		return
	}

	validBlockchains := map[string]bool{
		"ethereum": true,
		"polygon":  true,
		"arbitrum": true,
		"optimism": true,
		"base":     true,
	}
	if !validBlockchains[req.Blockchain] {
		httpErr(w, 400, "blockchain must be one of: ethereum, polygon, arbitrum, optimism, base")
		return
	}

	// Either github_url or source_code must be provided
	if req.GitHubURL == "" && req.SourceCode == "" {
		httpErr(w, 400, "either github_url or source_code must be provided")
		return
	}

	// Default to empty array if not provided
	if req.Agents == nil {
		req.Agents = []string{}
	}

	// Convert agents to JSON
	agentsJSON, err := json.Marshal(req.Agents)
	if err != nil {
		httpErr(w, 500, "json marshal")
		return
	}

	id := uuid.NewString()
	now := time.Now().UTC()

	_, err = a.DB.Exec(`
		INSERT INTO audits (id, owner_address, name, description, status, contract_address, blockchain, 
		                    github_url, source_code, agents_used, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, address, req.Name, req.Description, "pending", req.ContractAddress, req.Blockchain,
		req.GitHubURL, req.SourceCode, string(agentsJSON), now, now)

	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	audit := Audit{
		ID:              id,
		OwnerAddress:    address,
		Name:            req.Name,
		Description:     req.Description,
		Status:          "pending",
		ContractAddress: req.ContractAddress,
		Blockchain:      req.Blockchain,
		GitHubURL:       req.GitHubURL,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	writeJSON(w, 201, audit)
}

// handleStartAudit starts running an audit
func (a *App) handleStartAudit(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Extract ID from path: /audits/{id}/start
	id := r.PathValue("id")
	if id == "" {
		httpErr(w, 400, "missing audit ID")
		return
	}

	// Check if audit exists and user owns it
	var ownerAddress, status string
	err := a.DB.QueryRow(`SELECT owner_address, status FROM audits WHERE id = ?`, id).Scan(&ownerAddress, &status)
	if errors.Is(err, sql.ErrNoRows) {
		httpErr(w, 404, "Audit not found")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	if ownerAddress != address {
		httpErr(w, 403, "Not authorized to start this audit")
		return
	}

	// Check if already started
	if status != "pending" {
		httpErr(w, 400, "Audit can only be started from pending status")
		return
	}

	// Update status to in_progress and set started_at
	now := time.Now().UTC()
	_, err = a.DB.Exec(`
		UPDATE audits 
		SET status = 'in_progress', started_at = ?, updated_at = ?
		WHERE id = ?
	`, now, now, id)

	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	// TODO: Here we would trigger the AI agents to analyze the contract
	// This would typically be done via a job queue or background worker
	// For now, we just return success

	writeJSON(w, 200, map[string]interface{}{
		"id":         id,
		"status":     "in_progress",
		"started_at": now,
	})
}

// getFindingsCount returns count of findings by severity for an audit
func (a *App) getFindingsCount(auditID string) *FindingsCount {
	rows, err := a.DB.Query(`
		SELECT severity, COUNT(*) as count
		FROM findings
		WHERE audit_id = ?
		GROUP BY severity
	`, auditID)
	if err != nil {
		return &FindingsCount{}
	}
	defer rows.Close()

	count := &FindingsCount{}
	for rows.Next() {
		var severity string
		var c int
		if err := rows.Scan(&severity, &c); err != nil {
			continue
		}

		switch severity {
		case "critical":
			count.Critical = c
		case "high":
			count.High = c
		case "medium":
			count.Medium = c
		case "low":
			count.Low = c
		case "info":
			count.Info = c
		}
	}

	return count
}
