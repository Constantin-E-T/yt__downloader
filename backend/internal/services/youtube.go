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

var (
	ErrVideoNotFound         = errors.New("video not found")
	ErrVideoPrivate          = errors.New("video is private")
	ErrVideoAgeRestricted    = errors.New("video is age-restricted")
	ErrTranscriptDisabled    = errors.New("transcripts are disabled for this video")
	ErrTranscriptUnavailable = errors.New("transcript not available in requested language")
	ErrRateLimited           = errors.New("rate limited by YouTube")
)

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
		return nil, classifyVideoError(err)
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
		return nil, classifyVideoError(err)
	}

	tracks := transcriptCandidates(video.CaptionTracks, language)
	if len(tracks) == 0 {
		return nil, ErrTranscriptUnavailable
	}

	var lastErr error
	for _, track := range tracks {
		transcript, err := s.client.GetTranscript(video, track.LanguageCode)
		if err != nil {
			if errors.Is(err, youtube.ErrTranscriptDisabled) {
				lastErr = ErrTranscriptDisabled
				continue
			}
			lastErr = classifyTranscriptError(err)
			continue
		}
		if len(transcript) == 0 {
			lastErr = ErrTranscriptUnavailable
			continue
		}
		return convertTranscript(transcript), nil
	}

	if lastErr != nil {
		return nil, lastErr
	}

	return nil, ErrTranscriptUnavailable
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

func classifyVideoError(err error) error {
	if err == nil {
		return nil
	}

	errMsg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(errMsg, "video is private"):
		return fmt.Errorf("%w: %v", ErrVideoPrivate, err)
	case strings.Contains(errMsg, "age restricted"):
		return fmt.Errorf("%w: %v", ErrVideoAgeRestricted, err)
	case strings.Contains(errMsg, "not found"), strings.Contains(errMsg, "404"):
		return fmt.Errorf("%w: %v", ErrVideoNotFound, err)
	case strings.Contains(errMsg, "rate limit"), strings.Contains(errMsg, "429"):
		return fmt.Errorf("%w: %v", ErrRateLimited, err)
	default:
		return fmt.Errorf("fetch video metadata: %w", err)
	}
}

func classifyTranscriptError(err error) error {
	if err == nil {
		return nil
	}

	errMsg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(errMsg, "rate limit"), strings.Contains(errMsg, "429"):
		return fmt.Errorf("%w: %v", ErrRateLimited, err)
	case strings.Contains(errMsg, "not available"):
		return ErrTranscriptUnavailable
	default:
		return fmt.Errorf("fetch transcript: %w", err)
	}
}
