package api

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

var (
	ErrInvalidVideoURL   = errors.New("invalid video URL")
	ErrVideoURLRequired  = errors.New("video URL is required")
	ErrLanguageInvalid   = errors.New("invalid language code")
	ErrVideoIDExtraction = errors.New("failed to extract video ID from URL")
)

var videoIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)

// ValidateVideoURL checks whether the supplied URL (or ID) looks like a YouTube identifier
// and returns the canonical 11 character video ID.
func ValidateVideoURL(videoURL string) (string, error) {
	trimmed := strings.TrimSpace(videoURL)
	if trimmed == "" {
		return "", ErrVideoURLRequired
	}

	if videoIDPattern.MatchString(trimmed) && !strings.Contains(trimmed, "/") {
		return trimmed, nil
	}

	parsed, err := parseURLWithFallback(trimmed)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrInvalidVideoURL, err)
	}

	if !isYouTubeDomain(parsed.Host) {
		return "", fmt.Errorf("%w: not a YouTube URL", ErrInvalidVideoURL)
	}

	videoID := extractVideoIDFromURL(parsed)
	if videoID == "" {
		return "", ErrVideoIDExtraction
	}

	if !videoIDPattern.MatchString(videoID) {
		return "", fmt.Errorf("%w: invalid video ID format", ErrVideoIDExtraction)
	}

	return videoID, nil
}

func parseURLWithFallback(input string) (*url.URL, error) {
	u, err := url.Parse(input)
	if err == nil && u.Host != "" {
		return u, nil
	}

	u, err = url.Parse("https://" + input)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func extractVideoIDFromURL(u *url.URL) string {
	if u == nil {
		return ""
	}

	if strings.EqualFold(u.Host, "youtu.be") {
		return strings.Trim(strings.TrimSpace(u.Path), "/")
	}

	if id := u.Query().Get("v"); id != "" {
		return id
	}

	segments := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(segments) == 0 {
		return ""
	}
	return segments[len(segments)-1]
}

func isYouTubeDomain(host string) bool {
	host = strings.ToLower(strings.TrimSpace(host))
	switch host {
	case "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com":
		return true
	default:
		return false
	}
}

// ValidateLanguage validates that a provided language code is plausible.
func ValidateLanguage(lang string) error {
	if strings.TrimSpace(lang) == "" {
		return nil
	}

	normalized := strings.ToLower(strings.TrimSpace(lang))
	if len(normalized) < 2 || len(normalized) > 5 {
		return fmt.Errorf("%w: must be 2-5 characters", ErrLanguageInvalid)
	}

	return nil
}
