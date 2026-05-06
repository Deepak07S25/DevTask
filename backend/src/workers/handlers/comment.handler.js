const notificationService = require('../../services/notificationService');

const handleCommentAdded = async (payload) => {
    const { recipientId, data } = payload;
    await notificationService.createCommentNotification(recipientId, data);
};

module.exports = {
    handleCommentAdded
};
