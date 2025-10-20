package api

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error      string            `json:"error"`
	Message    string            `json:"message,omitempty"`
	StatusCode int               `json:"status_code"`
	Details    map[string]string `json:"details,omitempty"`
}

func writeStructuredError(w http.ResponseWriter, statusCode int, err error, userMessage string) {
	response := ErrorResponse{
		StatusCode: statusCode,
	}

	if userMessage != "" {
		response.Error = userMessage
	} else if err != nil {
		response.Error = err.Error()
	} else {
		response.Error = http.StatusText(statusCode)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(response)
}
