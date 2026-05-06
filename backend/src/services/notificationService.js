const prisma = require('../db/client');
const { emitNotificationToUser } = require('../config/socket');

const createNotification = async (userId, title, message, type, link) => {
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            link
        }
    });

    // Emit live event to connected clients
    emitNotificationToUser(userId, notification);

    return notification;
};

const createTaskAssignedNotification = async (recipientId, data) => {
    return await createNotification(
        recipientId,
        'Task Assigned',
        `You have been assigned to task "${data.entityTitle}"`,
        'TASK_ASSIGNED',
        data.link
    );
};

const createTaskUpdatedNotification = async (recipientId, data) => {
    return await createNotification(
        recipientId,
        'Task Updated',
        `There was an update to task "${data.entityTitle}"`,
        'TASK_UPDATED',
        data.link
    );
};

const createCommentNotification = async (recipientId, data) => {
    return await createNotification(
        recipientId,
        'New Comment',
        `${data.actorName} commented on task "${data.entityTitle}"`,
        'COMMENT_ADDED',
        data.link
    );
};

const createProjectAssignedNotification = async (recipientId, data) => {
    return await createNotification(
        recipientId,
        'Added to Project',
        `You have been added to the project "${data.entityTitle}"`,
        'PROJECT_ASSIGNED',
        data.link
    );
};

const getUserNotifications = async (userId, page = 1, limit = 50, unreadOnly = false) => {
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const where = { userId };
    if (unreadOnly) {
        where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take,
            skip
        }),
        prisma.notification.count({ where: { userId, read: false } })
    ]);

    return { data: notifications, meta: { unreadCount } };
};

const markAsRead = async (notificationId, userId) => {
    return await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true }
    });
};

const markAllAsRead = async (userId) => {
    return await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
};

const deleteNotification = async (notificationId, userId) => {
    return await prisma.notification.deleteMany({
        where: { id: notificationId, userId }
    });
};

module.exports = {
    createNotification,
    createTaskAssignedNotification,
    createTaskUpdatedNotification,
    createCommentNotification,
    createProjectAssignedNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
