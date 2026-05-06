const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
    try {
        const { page, limit, unread } = req.query;
        const unreadOnly = unread === 'true';
        const { data, meta } = await notificationService.getUserNotifications(req.user, page, limit, unreadOnly);
        res.set('X-Unread-Count', meta.unreadCount);
        res.status(200).json({ notifications: data, unreadCount: meta.unreadCount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markAsRead(id, req.user);
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user);
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.deleteNotification(id, req.user);
        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
