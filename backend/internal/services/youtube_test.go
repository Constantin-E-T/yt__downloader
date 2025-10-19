package services

import (
	"errors"
	"net/http"
	"testing"
	"time"

	youtube "github.com/kkdai/youtube/v2"
)

const testVideoID = "dQw4w9WgXcQ" // Public video: Rick Astley - Never Gonna Give You Up

type errorTransport struct{}

func (errorTransport) RoundTrip(*http.Request) (*http.Response, error) {
	return nil, errors.New("forced transport failure")
}

func TestYouTubeService_GetVideoMetadata_Success(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 0

	meta, err := service.GetVideoMetadata(testVideoID)
	if err != nil {
		t.Fatalf("GetVideoMetadata returned error: %v", err)
	}

	if meta == nil {
		t.Fatalf("expected metadata, got nil")
	}

	if meta.ID != testVideoID {
		t.Fatalf("expected ID %q, got %q", testVideoID, meta.ID)
	}

	if meta.Title == "" {
		t.Error("expected non-empty title")
	}

	if meta.Author == "" {
		t.Error("expected non-empty author")
	}

	if meta.Duration <= 0 {
		t.Errorf("expected positive duration, got %v", meta.Duration)
	}
}

func TestYouTubeService_GetVideoMetadata_InvalidID(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 0

	_, err := service.GetVideoMetadata("invalid!!!")
	if err == nil {
		t.Fatal("expected error for invalid video id")
	}
}

func TestYouTubeService_GetVideoMetadata_ClientError(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 0
	service.client = &youtube.Client{
		HTTPClient: &http.Client{Transport: errorTransport{}},
	}

	_, err := service.GetVideoMetadata(testVideoID)
	if err == nil {
		t.Fatal("expected error when client fails to fetch metadata")
	}
}

func TestExtractVideoID(t *testing.T) {
	cases := []struct {
		name  string
		input string
	}{
		{name: "plain id", input: testVideoID},
		{name: "youtu.be url", input: "https://youtu.be/" + testVideoID},
		{name: "watch url", input: "https://www.youtube.com/watch?v=" + testVideoID},
		{name: "embed url", input: "https://www.youtube.com/embed/" + testVideoID},
		{name: "shorts url", input: "https://www.youtube.com/shorts/" + testVideoID},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			id, err := extractVideoID(tc.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if id != testVideoID {
				t.Fatalf("expected %q, got %q", testVideoID, id)
			}
		})
	}

	if _, err := extractVideoID("https://www.youtube.com/watch?v="); err == nil {
		t.Fatal("expected error for url missing video id")
	}

	if _, err := extractVideoID("   "); err == nil {
		t.Fatal("expected error for empty input")
	}

	if _, err := extractVideoID("https://"); err == nil {
		t.Fatal("expected error when url lacks host")
	}
}

func TestWaitForRateLimit(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 50 * time.Millisecond
	service.lastRequest = time.Now()

	start := time.Now()
	service.waitForRateLimit()

	if elapsed := time.Since(start); elapsed < 40*time.Millisecond {
		t.Fatalf("expected wait close to %v, waited %v", service.minInterval, elapsed)
	}

	if service.lastRequest.Before(start) {
		t.Fatal("expected lastRequest updated after waiting")
	}
}

func TestYouTubeService_GetTranscript_DefaultLanguage(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 0

	lines, err := service.GetTranscript(testVideoID, "")
	if err != nil {
		t.Fatalf("GetTranscript returned error: %v", err)
	}
	if len(lines) == 0 {
		t.Fatal("expected transcript lines, got none")
	}
	if lines[0].Duration <= 0 {
		t.Fatalf("expected positive duration, got %v", lines[0].Duration)
	}
	if len(lines) > 1 && lines[1].Start < lines[0].Start {
		t.Fatalf("expected monotonic start times, got %v then %v", lines[0].Start, lines[1].Start)
	}
}

func TestYouTubeService_GetTranscript_LanguageSelection(t *testing.T) {
	const videoWithIndonesianTranscript = "AXwDvYh2-uk"

	service := NewYouTubeService()
	service.minInterval = 0

	video, err := service.client.GetVideo(videoWithIndonesianTranscript)
	if err != nil {
		t.Fatalf("GetVideo returned error: %v", err)
	}

	candidates := transcriptCandidates(video.CaptionTracks, "id")
	if len(candidates) == 0 {
		t.Fatal("expected language candidates, found none")
	}
	if candidates[0].LanguageCode != "id" || candidates[0].Kind != "asr" {
		t.Fatalf("expected first candidate to be id auto transcript, got %s %s", candidates[0].LanguageCode, candidates[0].Kind)
	}

	lines, err := service.GetTranscript(videoWithIndonesianTranscript, "id")
	if err != nil {
		t.Fatalf("GetTranscript returned error: %v", err)
	}
	if len(lines) == 0 {
		t.Fatal("expected transcript lines, got none")
	}
	if lines[0].Start < 0 {
		t.Fatalf("expected non-negative start, got %v", lines[0].Start)
	}
}

func TestYouTubeService_GetTranscript_Missing(t *testing.T) {
	const videoWithoutTranscript = "5NV6Rdv1a3I"

	service := NewYouTubeService()
	service.minInterval = 0

	_, err := service.GetTranscript(videoWithoutTranscript, "en")
	if err == nil {
		t.Fatal("expected error when transcript is missing")
	}
}

func TestYouTubeService_GetTranscript_InvalidID(t *testing.T) {
	service := NewYouTubeService()
	service.minInterval = 0

	if _, err := service.GetTranscript("!invalid!", "en"); err == nil {
		t.Fatal("expected error for invalid video id")
	}
}

func TestTranscriptCandidatesOrdering(t *testing.T) {
	tracks := []youtube.CaptionTrack{
		{LanguageCode: "en", Kind: ""},
		{LanguageCode: "en", Kind: "asr"},
		{LanguageCode: "es", Kind: "asr"},
	}

	ordered := transcriptCandidates(tracks, "es")
	if len(ordered) < 3 {
		t.Fatalf("expected at least 3 candidates, got %d", len(ordered))
	}
	if ordered[0].LanguageCode != "es" || ordered[0].Kind != "asr" {
		t.Fatalf("expected first candidate to be es auto, got %s %s", ordered[0].LanguageCode, ordered[0].Kind)
	}
	if ordered[1].LanguageCode != "en" || ordered[1].Kind != "" {
		t.Fatalf("expected second candidate to be default manual, got %s %s", ordered[1].LanguageCode, ordered[1].Kind)
	}
}

func TestTranscriptCandidatesFallback(t *testing.T) {
	tracks := []youtube.CaptionTrack{
		{LanguageCode: "es", Kind: "asr"},
	}

	ordered := transcriptCandidates(tracks, "fr")
	if len(ordered) != 1 {
		t.Fatalf("expected fallback to return 1 candidate, got %d", len(ordered))
	}
	if ordered[0].LanguageCode != "es" {
		t.Fatalf("expected fallback to choose available language, got %s", ordered[0].LanguageCode)
	}
}

func TestConvertTranscript(t *testing.T) {
	src := youtube.VideoTranscript{
		{Text: " hello ", StartMs: 1000, Duration: 2500},
	}

	lines := convertTranscript(src)
	if len(lines) != 1 {
		t.Fatalf("expected 1 line, got %d", len(lines))
	}
	if lines[0].Start != time.Second {
		t.Fatalf("expected start to be 1s, got %v", lines[0].Start)
	}
	if lines[0].Duration != 2500*time.Millisecond {
		t.Fatalf("expected duration 2.5s, got %v", lines[0].Duration)
	}
	if lines[0].Text != "hello" {
		t.Fatalf("expected trimmed text, got %q", lines[0].Text)
	}
}

func TestKindMatchesDefault(t *testing.T) {
	if !kindMatches("caption", "") {
		t.Fatal("expected kindMatches to allow unspecified kind")
	}
}
