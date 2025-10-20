package api

import (
	"testing"
)

func TestValidateVideoURL(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{name: "valid youtube.com", input: "https://youtube.com/watch?v=dQw4w9WgXcQ", wantErr: false},
		{name: "valid youtu.be", input: "https://youtu.be/dQw4w9WgXcQ", wantErr: false},
		{name: "valid with params", input: "https://youtube.com/watch?v=dQw4w9WgXcQ&t=10", wantErr: false},
		{name: "plain video ID", input: "dQw4w9WgXcQ", wantErr: false},
		{name: "empty string", input: "", wantErr: true},
		{name: "invalid domain", input: "https://example.com/watch?v=123", wantErr: true},
		{name: "malformed URL", input: "not a url", wantErr: true},
		{name: "short id", input: "abc", wantErr: true},
		{name: "youtube without id", input: "https://youtube.com/watch?v=", wantErr: true},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			_, err := ValidateVideoURL(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ValidateVideoURL(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateLanguage(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{name: "empty optional", input: "", wantErr: false},
		{name: "valid en", input: "en", wantErr: false},
		{name: "valid uppercase", input: "EN", wantErr: false},
		{name: "valid extended", input: "zh-h", wantErr: false},
		{name: "too short", input: "e", wantErr: true},
		{name: "too long", input: "english", wantErr: true},
		{name: "trim spaces", input: "  es  ", wantErr: false},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateLanguage(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ValidateLanguage(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}
