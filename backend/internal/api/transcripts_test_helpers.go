package api

import (
	"context"
	"time"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

type fakeYouTubeService struct {
	meta           *services.VideoMetadata
	metaErr        error
	transcript     []services.TranscriptLine
	transcriptErr  error
	lastMetaInput  string
	lastTransVideo string
	lastLanguage   string
}

func (f *fakeYouTubeService) GetVideoMetadata(videoID string) (*services.VideoMetadata, error) {
	f.lastMetaInput = videoID
	if f.metaErr != nil {
		return nil, f.metaErr
	}
	return f.meta, nil
}

func (f *fakeYouTubeService) GetTranscript(videoID, language string) ([]services.TranscriptLine, error) {
	f.lastTransVideo = videoID
	f.lastLanguage = language
	if f.transcriptErr != nil {
		return nil, f.transcriptErr
	}
	return f.transcript, nil
}

type recordingVideoRepo struct {
	saved []*db.Video
	err   error
}

func (r *recordingVideoRepo) SaveVideo(_ context.Context, video *db.Video) error {
	if r.err != nil {
		return r.err
	}
	if video.ID == "" {
		video.ID = "video-uuid"
	}
	video.CreatedAt = time.Now()
	clone := *video
	r.saved = append(r.saved, &clone)
	return nil
}

type recordingTranscriptRepo struct {
	saved []*db.Transcript
	err   error
}

func (r *recordingTranscriptRepo) SaveTranscript(_ context.Context, transcript *db.Transcript) error {
	if r.err != nil {
		return r.err
	}
	if transcript.ID == "" {
		transcript.ID = "transcript-uuid"
	}
	transcript.CreatedAt = time.Now()
	clone := *transcript
	r.saved = append(r.saved, &clone)
	return nil
}
