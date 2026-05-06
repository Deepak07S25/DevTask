const notificationService = require('../../services/notificationService');

const handleTaskAssigned = async (payload) => {
    const { recipientId, data } = payload;
    await notificationService.createTaskAssignedNotification(recipientId, data);
};

const handleTaskUpdated = async (payload) => {
    const { recipientId, data } = payload;
    await notificationService.createTaskUpdatedNotification(recipientId, data);
};

module.exports = {
    handleTaskAssigned,
    handleTaskUpdated
};
