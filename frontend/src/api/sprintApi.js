import API from './axios';

export const sprintApi = {
    getSprints: (projectId) =>
        API.get(`/sprints?projectId=${projectId}`).then(r => r.data),

    createSprint: (data) =>
        API.post('/sprints', data).then(r => r.data),

    updateSprint: (sprintId, data) =>
        API.patch(`/sprints/${sprintId}`, data).then(r => r.data),

    deleteSprint: (sprintId) =>
        API.delete(`/sprints/${sprintId}`).then(r => r.data),

    addTaskToSprint: (sprintId, taskId) =>
        API.patch(`/sprints/${sprintId}/tasks/${taskId}`).then(r => r.data),

    removeTaskFromSprint: (sprintId, taskId) =>
        API.delete(`/sprints/${sprintId}/tasks/${taskId}`).then(r => r.data),
};
