package db

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTranscriptSegments_ValueAndScan(t *testing.T) {
	segments := TranscriptSegments{{StartMs: 1000, DurationMs: 500, Text: "hello"}}

	value, err := segments.Value()
	require.NoError(t, err)
	asBytes, ok := value.([]byte)
	require.True(t, ok)
	assert.Contains(t, string(asBytes), "hello")

	var scanned TranscriptSegments
	err = scanned.Scan(value)
	require.NoError(t, err)
	assert.Equal(t, segments, scanned)

	var empty TranscriptSegments
	value, err = empty.Value()
	require.NoError(t, err)
	assert.Equal(t, "[]", string(value.([]byte)))

	var fromNil TranscriptSegments
	err = fromNil.Scan(nil)
	require.NoError(t, err)
	assert.Len(t, fromNil, 0)

	err = fromNil.Scan([]byte{})
	require.NoError(t, err)
	assert.Len(t, fromNil, 0)

	jsonString := `[{"start_ms":0,"duration_ms":1000,"text":"hi"}]`
	err = fromNil.Scan(jsonString)
	require.NoError(t, err)
	assert.Equal(t, int64(0), fromNil[0].StartMs)
	assert.Equal(t, "hi", fromNil[0].Text)

	err = fromNil.Scan(123)
	assert.Error(t, err)
}
