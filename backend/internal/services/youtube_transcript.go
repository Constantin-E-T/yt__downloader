package services

import (
	"strings"
	"time"

	youtube "github.com/kkdai/youtube/v2"
)

const (
	defaultTranscriptLanguage = "en"
	autoCaptionKind           = "asr"
)

func transcriptCandidates(tracks []youtube.CaptionTrack, lang string) []*youtube.CaptionTrack {
	requested := normalizeLang(lang)
	defNorm := normalizeLang(defaultTranscriptLanguage)

	added := make(map[string]struct{})
	store := func(track *youtube.CaptionTrack) []*youtube.CaptionTrack {
		key := strings.ToLower(track.LanguageCode) + "|" + track.Kind
		if _, seen := added[key]; seen {
			return nil
		}
		added[key] = struct{}{}
		return []*youtube.CaptionTrack{track}
	}

	var ordered []*youtube.CaptionTrack
	for _, target := range []struct {
		lang string
		kind string
	}{
		{requested, "manual"},
		{requested, "auto"},
		{defNorm, "manual"},
		{defNorm, "auto"},
	} {
		if target.lang == "" {
			continue
		}
		for i := range tracks {
			if kindMatches(tracks[i].Kind, target.kind) && languageMatches(tracks[i].LanguageCode, target.lang) {
				ordered = append(ordered, store(&tracks[i])...)
			}
		}
	}

	if len(ordered) == 0 {
		for i := range tracks {
			if tracks[i].Kind != autoCaptionKind {
				ordered = append(ordered, store(&tracks[i])...)
			}
		}
	}
	if len(ordered) == 0 {
		for i := range tracks {
			ordered = append(ordered, store(&tracks[i])...)
		}
	}

	return ordered
}

func convertTranscript(src youtube.VideoTranscript) []TranscriptLine {
	lines := make([]TranscriptLine, 0, len(src))
	for _, segment := range src {
		lines = append(lines, TranscriptLine{
			Start:    time.Duration(segment.StartMs) * time.Millisecond,
			Duration: time.Duration(segment.Duration) * time.Millisecond,
			Text:     strings.TrimSpace(segment.Text),
		})
	}
	return lines
}

func languageMatches(code, desired string) bool {
	code = normalizeLang(code)
	return code == desired || (desired != "" && strings.HasPrefix(code, desired+"-"))
}

func normalizeLang(value string) string {
	return strings.TrimSpace(strings.ToLower(value))
}

func kindMatches(kind, desired string) bool {
	switch desired {
	case "manual":
		return kind != autoCaptionKind
	case "auto":
		return kind == autoCaptionKind
	default:
		return true
	}
}
