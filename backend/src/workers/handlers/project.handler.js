const notificationService = require('../../services/notificationService');

const handleProjectAssigned = async (payload) => {
    const { recipientId, data } = payload;
    await notificationService.createProjectAssignedNotification(recipientId, data);
};

module.exports = {
    handleProjectAssigned
};
