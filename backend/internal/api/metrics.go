package api

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

type MetricsResponse struct {
	Uptime       string `json:"uptime"`
	MemoryUsage  uint64 `json:"memory_usage_bytes"`
	NumGoroutine int    `json:"num_goroutines"`
	NumCPU       int    `json:"num_cpu"`
}

var startTime = time.Now()

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	response := MetricsResponse{
		Uptime:       time.Since(startTime).String(),
		MemoryUsage:  m.Alloc,
		NumGoroutine: runtime.NumGoroutine(),
		NumCPU:       runtime.NumCPU(),
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}
