package app

import (
	"net/http"
)

// MCPServer represents an MCP server
type MCPServer struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
}

// handleGetMCPServers returns all available MCP servers
func (a *App) handleGetMCPServers(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.Query(`
		SELECT id, name, description, enabled
		FROM mcp_servers
		ORDER BY name ASC
	`)
	if err != nil {
		httpErr(w, 500, "db")
		return
	}
	defer rows.Close()

	servers := []MCPServer{}
	for rows.Next() {
		var server MCPServer
		var enabled int

		err := rows.Scan(
			&server.ID,
			&server.Name,
			&server.Description,
			&enabled,
		)
		if err != nil {
			httpErr(w, 500, "scan")
			return
		}

		server.Enabled = enabled == 1
		servers = append(servers, server)
	}

	writeJSON(w, 200, map[string][]MCPServer{"servers": servers})
}
