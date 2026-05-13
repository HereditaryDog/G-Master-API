package vertex

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildFetchOperationURLUsesCustomBaseURL(t *testing.T) {
	got, err := buildFetchOperationURL(
		"https://vertex-proxy.example.com/google",
		"projects/project-123/locations/us-central1/publishers/google/models/veo-3.0-generate-001/operations/op-123",
	)

	require.NoError(t, err)
	require.Equal(t, "https://vertex-proxy.example.com/google/v1/projects/project-123/locations/us-central1/publishers/google/models/veo-3.0-generate-001:fetchPredictOperation", got)
}

func TestBuildFetchOperationURLRejectsMissingModel(t *testing.T) {
	_, err := buildFetchOperationURL(
		"https://vertex-proxy.example.com/google",
		"projects/project-123/locations/us-central1/operations/op-123",
	)

	require.ErrorContains(t, err, "cannot extract model")
}
