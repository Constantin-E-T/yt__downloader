package services

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	youtube "github.com/kkdai/youtube/v2"
)

var videoIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{6,}$`)

// VideoMetadata represents the subset of metadata needed by downstream services.
type VideoMetadata struct {
	ID          string
	Title       string
	Author      string
	Duration    time.Duration
	Description string
}

// TranscriptLine represents a single caption element with timing metadata.
type TranscriptLine struct {
	Start    time.Duration
	Duration time.Duration
	Text     string
}

// YouTubeService fetches metadata from YouTube while enforcing simple rate limits.
type YouTubeService struct {
	client      *youtube.Client
	mu          sync.Mutex
	lastRequest time.Time
	minInterval time.Duration
}

// NewYouTubeService constructs a YouTubeService using the default youtube client.
func NewYouTubeService() *YouTubeService {
	return &YouTubeService{
		client:      &youtube.Client{},
		minInterval: 500 * time.Millisecond,
	}
}

// GetVideoMetadata retrieves video metadata for the provided identifier or URL.
func (s *YouTubeService) GetVideoMetadata(videoID string) (*VideoMetadata, error) {
	if s == nil {
		return nil, errors.New("youtube service is nil")
	}

	id, err := extractVideoID(videoID)
	if err != nil {
		return nil, fmt.Errorf("extract video id: %w", err)
	}

	s.waitForRateLimit()

	video, err := s.client.GetVideo(id)
	if err != nil {
		return nil, fmt.Errorf("fetch video metadata: %w", err)
	}

	return &VideoMetadata{
		ID:          video.ID,
		Title:       video.Title,
		Author:      video.Author,
		Duration:    video.Duration,
		Description: video.Description,
	}, nil
}

// GetTranscript retrieves timed transcript lines for a video in the requested language.
// If the requested language is unavailable it falls back to English, favouring manual tracks
// before auto-generated ones.
func (s *YouTubeService) GetTranscript(videoID, language string) ([]TranscriptLine, error) {
	if s == nil {
		return nil, errors.New("youtube service is nil")
	}

	id, err := extractVideoID(videoID)
	if err != nil {
		return nil, fmt.Errorf("extract video id: %w", err)
	}

	s.waitForRateLimit()

	video, err := s.client.GetVideo(id)
	if err != nil {
		return nil, fmt.Errorf("fetch video metadata: %w", err)
	}

	tracks := transcriptCandidates(video.CaptionTracks, language)
	if len(tracks) == 0 {
		return nil, errors.New("transcript not available")
	}

	var lastErr error
	for _, track := range tracks {
		transcript, err := s.client.GetTranscript(video, track.LanguageCode)
		if err != nil {
			lastErr = err
			continue
		}
		if len(transcript) == 0 {
			lastErr = errors.New("transcript empty")
			continue
		}
		return convertTranscript(transcript), nil
	}

	if lastErr != nil {
		return nil, fmt.Errorf("fetch transcript: %w", lastErr)
	}

	return nil, errors.New("transcript not available")
}

func (s *YouTubeService) waitForRateLimit() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.minInterval <= 0 {
		s.lastRequest = time.Now()
		return
	}

	now := time.Now()
	if elapsed := now.Sub(s.lastRequest); elapsed < s.minInterval {
		time.Sleep(s.minInterval - elapsed)
		now = time.Now()
	}

	s.lastRequest = now
}

func extractVideoID(input string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", errors.New("empty video identifier")
	}

	if id, err := youtube.ExtractVideoID(trimmed); err == nil && id != "" {
		return validateVideoID(id)
	}

	u, err := url.Parse(trimmed)
	if err != nil || u.Host == "" {
		return "", fmt.Errorf("invalid video identifier: %s", trimmed)
	}

	if v := u.Query().Get("v"); v != "" {
		return validateVideoID(v)
	}

	segments := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(segments) == 0 {
		return "", fmt.Errorf("missing video identifier in %s", trimmed)
	}

	return validateVideoID(segments[len(segments)-1])
}

func validateVideoID(id string) (string, error) {
	if !videoIDPattern.MatchString(id) {
		return "", fmt.Errorf("invalid video id: %s", id)
	}

	return id, nil
}
