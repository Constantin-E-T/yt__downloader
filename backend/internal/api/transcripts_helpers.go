package api

import (
	"context"
	"strings"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

// TranscriptRequest captures the payload for transcript fetch requests.
type TranscriptRequest struct {
	VideoURL string `json:"video_url"`
	Language string `json:"language,omitempty"`
}

// TranscriptLine represents a single transcript entry returned to clients.
type TranscriptLine struct {
	Start    int64  `json:"start"`
	Duration int64  `json:"duration"`
	Text     string `json:"text"`
}

// TranscriptResponse is the API response for transcript fetch requests.
type TranscriptResponse struct {
	VideoID    string           `json:"video_id"`
	Title      string           `json:"title"`
	Language   string           `json:"language"`
	Transcript []TranscriptLine `json:"transcript"`
}

func fetchMetadataWithContext(ctx context.Context, yt youtubeService, videoID string) (*services.VideoMetadata, error) {
	type result struct {
		meta *services.VideoMetadata
		err  error
	}

	resultCh := make(chan result, 1)
	go func() {
		meta, err := yt.GetVideoMetadata(videoID)
		resultCh <- result{meta: meta, err: err}
	}()

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-resultCh:
		return res.meta, res.err
	}
}

func fetchTranscriptWithContext(ctx context.Context, yt youtubeService, videoID, language string) ([]services.TranscriptLine, error) {
	type result struct {
		lines []services.TranscriptLine
		err   error
	}

	resultCh := make(chan result, 1)
	go func() {
		lines, err := yt.GetTranscript(videoID, language)
		resultCh <- result{lines: lines, err: err}
	}()

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-resultCh:
		return res.lines, res.err
	}
}

func convertTranscriptLines(lines []services.TranscriptLine) (db.TranscriptSegments, []TranscriptLine) {
	dbSegments := make(db.TranscriptSegments, 0, len(lines))
	apiLines := make([]TranscriptLine, 0, len(lines))

	for _, line := range lines {
		startMs := line.Start.Milliseconds()
		durationMs := line.Duration.Milliseconds()
		dbSegments = append(dbSegments, db.TranscriptSegment{
			StartMs:    startMs,
			DurationMs: durationMs,
			Text:       strings.TrimSpace(line.Text),
		})
		apiLines = append(apiLines, TranscriptLine{
			Start:    startMs,
			Duration: durationMs,
			Text:     strings.TrimSpace(line.Text),
		})
	}

	return dbSegments, apiLines
}

func isDatabaseUnavailableError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "database connection failed") ||
		strings.Contains(msg, "connection refused") ||
		strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "no connection")
}
