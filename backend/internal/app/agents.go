package app

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Agent represents an AI agent
type Agent struct {
	ID           string    `json:"id"`
	OwnerAddress string    `json:"owner_address"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	Model        string    `json:"model"`
	SystemPrompt string    `json:"system_prompt"`
	MCPServers   []string  `json:"mcp_servers"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateAgentRequest represents the request to create an agent
type CreateAgentRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Model        string   `json:"model"`
	SystemPrompt string   `json:"system_prompt"`
	MCPServers   []string `json:"mcp_servers"`
}

// UpdateAgentRequest represents the request to update an agent
type UpdateAgentRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Model        string   `json:"model"`
	SystemPrompt string   `json:"system_prompt"`
	MCPServers   []string `json:"mcp_servers"`
}

// handleGetAgents returns all agents for the authenticated user
func (a *App) handleGetAgents(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	rows, err := a.DB.Query(`
		SELECT id, owner_address, name, description, model, system_prompt, mcp_servers, created_at, updated_at
		FROM agents
		WHERE owner_address = ?
		ORDER BY created_at DESC
	`, address)
	if err != nil {
		httpErr(w, 500, "db")
		return
	}
	defer rows.Close()

	agents := []Agent{}
	for rows.Next() {
		var agent Agent
		var mcpServersJSON string
		var desc sql.NullString

		err := rows.Scan(
			&agent.ID,
			&agent.OwnerAddress,
			&agent.Name,
			&desc,
			&agent.Model,
			&agent.SystemPrompt,
			&mcpServersJSON,
			&agent.CreatedAt,
			&agent.UpdatedAt,
		)
		if err != nil {
			httpErr(w, 500, "scan")
			return
		}

		if desc.Valid {
			agent.Description = desc.String
		}

		// Parse JSON array of MCP servers
		if err := json.Unmarshal([]byte(mcpServersJSON), &agent.MCPServers); err != nil {
			agent.MCPServers = []string{}
		}

		agents = append(agents, agent)
	}

	writeJSON(w, 200, map[string][]Agent{"agents": agents})
}

// handleGetAgent returns a specific agent by ID
func (a *App) handleGetAgent(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Extract ID from path: /agents/{id}
	id := r.PathValue("id")
	if id == "" {
		httpErr(w, 400, "missing agent ID")
		return
	}

	var agent Agent
	var mcpServersJSON string
	var desc sql.NullString

	err := a.DB.QueryRow(`
		SELECT id, owner_address, name, description, model, system_prompt, mcp_servers, created_at, updated_at
		FROM agents
		WHERE id = ?
	`, id).Scan(
		&agent.ID,
		&agent.OwnerAddress,
		&agent.Name,
		&desc,
		&agent.Model,
		&agent.SystemPrompt,
		&mcpServersJSON,
		&agent.CreatedAt,
		&agent.UpdatedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		httpErr(w, 404, "Agent not found")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	// Check ownership (users can only view their own agents)
	if agent.OwnerAddress != address {
		httpErr(w, 404, "Agent not found")
		return
	}

	if desc.Valid {
		agent.Description = desc.String
	}

	// Parse JSON array of MCP servers
	if err := json.Unmarshal([]byte(mcpServersJSON), &agent.MCPServers); err != nil {
		agent.MCPServers = []string{}
	}

	writeJSON(w, 200, agent)
}

// handleCreateAgent creates a new agent
func (a *App) handleCreateAgent(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	var req CreateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpErr(w, 400, "bad json")
		return
	}

	// Validation
	req.Name = strings.TrimSpace(req.Name)
	req.Model = strings.TrimSpace(req.Model)
	req.SystemPrompt = strings.TrimSpace(req.SystemPrompt)

	if req.Name == "" || len(req.Name) > 100 {
		httpErr(w, 400, "name must be 1-100 characters")
		return
	}
	if req.Model == "" {
		httpErr(w, 400, "model is required")
		return
	}
	if req.SystemPrompt == "" || len(req.SystemPrompt) > 10000 {
		httpErr(w, 400, "system_prompt must be 1-10000 characters")
		return
	}

	// Default to empty array if not provided
	if req.MCPServers == nil {
		req.MCPServers = []string{}
	}

	// Convert MCP servers to JSON
	mcpServersJSON, err := json.Marshal(req.MCPServers)
	if err != nil {
		httpErr(w, 500, "json marshal")
		return
	}

	id := uuid.NewString()
	now := time.Now().UTC()

	_, err = a.DB.Exec(`
		INSERT INTO agents (id, owner_address, name, description, model, system_prompt, mcp_servers, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, address, req.Name, req.Description, req.Model, req.SystemPrompt, string(mcpServersJSON), now, now)

	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	agent := Agent{
		ID:           id,
		OwnerAddress: address,
		Name:         req.Name,
		Description:  req.Description,
		Model:        req.Model,
		SystemPrompt: req.SystemPrompt,
		MCPServers:   req.MCPServers,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	writeJSON(w, 201, agent)
}

// handleUpdateAgent updates an existing agent
func (a *App) handleUpdateAgent(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Extract ID from path: /agents/{id}
	id := r.PathValue("id")
	if id == "" {
		httpErr(w, 400, "missing agent ID")
		return
	}

	var req UpdateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpErr(w, 400, "bad json")
		return
	}

	// Check if agent exists and user owns it
	var ownerAddress string
	err := a.DB.QueryRow(`SELECT owner_address FROM agents WHERE id = ?`, id).Scan(&ownerAddress)
	if errors.Is(err, sql.ErrNoRows) {
		httpErr(w, 404, "Agent not found")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	if ownerAddress != address {
		httpErr(w, 403, "Not authorized to modify this agent")
		return
	}

	// Validation
	req.Name = strings.TrimSpace(req.Name)
	req.Model = strings.TrimSpace(req.Model)
	req.SystemPrompt = strings.TrimSpace(req.SystemPrompt)

	if req.Name == "" || len(req.Name) > 100 {
		httpErr(w, 400, "name must be 1-100 characters")
		return
	}
	if req.Model == "" {
		httpErr(w, 400, "model is required")
		return
	}
	if req.SystemPrompt == "" || len(req.SystemPrompt) > 10000 {
		httpErr(w, 400, "system_prompt must be 1-10000 characters")
		return
	}

	// Default to empty array if not provided
	if req.MCPServers == nil {
		req.MCPServers = []string{}
	}

	// Convert MCP servers to JSON
	mcpServersJSON, err := json.Marshal(req.MCPServers)
	if err != nil {
		httpErr(w, 500, "json marshal")
		return
	}

	now := time.Now().UTC()

	_, err = a.DB.Exec(`
		UPDATE agents
		SET name = ?, description = ?, model = ?, system_prompt = ?, mcp_servers = ?, updated_at = ?
		WHERE id = ?
	`, req.Name, req.Description, req.Model, req.SystemPrompt, string(mcpServersJSON), now, id)

	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	// Fetch the updated agent
	var agent Agent
	var mcpJSON string
	var desc sql.NullString
	err = a.DB.QueryRow(`
		SELECT id, owner_address, name, description, model, system_prompt, mcp_servers, created_at, updated_at
		FROM agents
		WHERE id = ?
	`, id).Scan(
		&agent.ID,
		&agent.OwnerAddress,
		&agent.Name,
		&desc,
		&agent.Model,
		&agent.SystemPrompt,
		&mcpJSON,
		&agent.CreatedAt,
		&agent.UpdatedAt,
	)

	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	if desc.Valid {
		agent.Description = desc.String
	}

	if err := json.Unmarshal([]byte(mcpJSON), &agent.MCPServers); err != nil {
		agent.MCPServers = []string{}
	}

	writeJSON(w, 200, agent)
}

// handleDeleteAgent deletes an agent
func (a *App) handleDeleteAgent(w http.ResponseWriter, r *http.Request) {
	address, ok := getAuthAddress(r)
	if !ok {
		httpErr(w, 401, "Not authenticated")
		return
	}

	// Extract ID from path: /agents/{id}
	id := r.PathValue("id")
	if id == "" {
		httpErr(w, 400, "missing agent ID")
		return
	}

	// Check if agent exists and user owns it
	var ownerAddress string
	err := a.DB.QueryRow(`SELECT owner_address FROM agents WHERE id = ?`, id).Scan(&ownerAddress)
	if errors.Is(err, sql.ErrNoRows) {
		httpErr(w, 404, "Agent not found")
		return
	}
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	if ownerAddress != address {
		httpErr(w, 403, "Not authorized to delete this agent")
		return
	}

	_, err = a.DB.Exec(`DELETE FROM agents WHERE id = ?`, id)
	if err != nil {
		httpErr(w, 500, "db")
		return
	}

	writeJSON(w, 200, map[string]bool{"success": true})
}
