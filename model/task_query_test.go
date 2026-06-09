package model

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/constant"
)

func TestGetAllUnFinishSyncTasksSkipsOpenAIImageTasks(t *testing.T) {
	truncateTables(t)

	insertTask(t, &Task{
		TaskID:   "unfinished_suno_video",
		Platform: constant.TaskPlatformSuno,
		Status:   TaskStatusInProgress,
		Progress: "50%",
	})
	insertTask(t, &Task{
		TaskID:   "unfinished_midjourney",
		Platform: constant.TaskPlatformMidjourney,
		Status:   TaskStatusQueued,
		Progress: "0%",
	})
	insertTask(t, &Task{
		TaskID:   "unfinished_openai_image",
		Platform: constant.TaskPlatformOpenAIImage,
		Status:   TaskStatusInProgress,
		Progress: "50%",
	})
	insertTask(t, &Task{
		TaskID:   "finished_suno_video",
		Platform: constant.TaskPlatformSuno,
		Status:   TaskStatusSuccess,
		Progress: "100%",
	})

	tasks := GetAllUnFinishSyncTasks(10)

	require.Len(t, tasks, 2)
	require.ElementsMatch(t, []string{"unfinished_suno_video", "unfinished_midjourney"}, taskIDs(tasks))
	for _, task := range tasks {
		require.NotEqual(t, constant.TaskPlatformOpenAIImage, task.Platform)
	}
}

func taskIDs(tasks []*Task) []string {
	ids := make([]string, 0, len(tasks))
	for _, task := range tasks {
		ids = append(ids, task.TaskID)
	}
	return ids
}
