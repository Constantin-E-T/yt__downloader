package api

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

// HealthResponse represents the JSON response for the health endpoint
type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

// handleHealth handles GET /api/v1/health requests
// It checks database connectivity and returns the service health status
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	// Set response header
	w.Header().Set("Content-Type", "application/json")

	// Create context with timeout for database ping
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Check database connectivity
	dbStatus := "connected"
	statusCode := http.StatusOK

	if err := s.db.Ping(ctx); err != nil {
		dbStatus = "disconnected"
		statusCode = http.StatusServiceUnavailable
	}

	// Prepare response
	response := HealthResponse{
		Status:   getOverallStatus(dbStatus),
		Database: dbStatus,
	}

	// Set status code
	w.WriteHeader(statusCode)

	// Encode and send response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		// If encoding fails, log it but we've already written the status code
		http.Error(w, `{"status":"error","database":"unknown"}`, http.StatusInternalServerError)
		return
	}
}

// getOverallStatus determines the overall service status based on component statuses
func getOverallStatus(dbStatus string) string {
	if dbStatus == "connected" {
		return "ok"
	}
	return "error"
}
