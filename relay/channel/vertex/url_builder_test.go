package vertex

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildGoogleModelURLUsesCustomBaseURL(t *testing.T) {
	got := BuildGoogleModelURL(
		"https://vertex-proxy.example.com/google",
		DefaultAPIVersion,
		"project-123",
		"us-central1",
		"gemini-2.5-pro",
		"streamGenerateContent?alt=sse",
	)

	require.Equal(t, "https://vertex-proxy.example.com/google/v1/projects/project-123/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent?alt=sse", got)
}

func TestBuildGoogleModelURLDoesNotDuplicateAPIVersion(t *testing.T) {
	got := BuildGoogleModelURL(
		"https://vertex-proxy.example.com/google/v1",
		DefaultAPIVersion,
		"project-123",
		"global",
		"gemini-2.5-pro",
		"generateContent",
	)

	require.Equal(t, "https://vertex-proxy.example.com/google/v1/projects/project-123/locations/global/publishers/google/models/gemini-2.5-pro:generateContent", got)
}

func TestBuildGoogleModelURLDefaultsToGoogleRegionalHost(t *testing.T) {
	got := BuildGoogleModelURL(
		"",
		DefaultAPIVersion,
		"project-123",
		"europe-west4",
		"gemini-2.5-pro",
		"generateContent",
	)

	require.Equal(t, "https://europe-west4-aiplatform.googleapis.com/v1/projects/project-123/locations/europe-west4/publishers/google/models/gemini-2.5-pro:generateContent", got)
}

func TestBuildOpenSourceChatCompletionsURLUsesCustomBaseURL(t *testing.T) {
	got := BuildOpenSourceChatCompletionsURL(
		"https://vertex-proxy.example.com/open",
		"project-123",
		"us-central1",
	)

	require.Equal(t, "https://vertex-proxy.example.com/open/v1beta1/projects/project-123/locations/us-central1/endpoints/openapi/chat/completions", got)
}
