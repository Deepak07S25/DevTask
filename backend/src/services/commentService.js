const prisma = require('../db/client');
const { enqueueNotification } = require('../queues/notificationQueue');

const getComments = async (taskId, page = 1, limit = 1000) => {
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 100, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const [comments, totalCount] = await Promise.all([
        prisma.comment.findMany({
            where: { taskId },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' },
            take,
            skip
        }),
        prisma.comment.count({ where: { taskId } })
    ]);

    return { data: comments, meta: { totalCount, totalPages: Math.ceil(totalCount / take) } };
};

const addComment = async (taskId, authorId, body) => {
    const comment = await prisma.comment.create({
        data: { body, taskId, authorId },
        include: {
            author: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, title: true, projectId: true, assigneeId: true }
    });

    if (task && task.assigneeId && task.assigneeId !== authorId) {
        await enqueueNotification('COMMENT_ADDED', {
            recipientId: task.assigneeId,
            actorId: authorId,
            data: {
                entityId: task.id,
                entityTitle: task.title,
                actorName: comment.author.name,
                link: `/project/${task.projectId}`
            }
        });
    }

    return comment;
};

const deleteComment = async (commentId, authorId) => {
    // Only allow the author to delete their own comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    if (comment.authorId !== authorId) throw new Error('Not authorized to delete this comment');
    return await prisma.comment.delete({ where: { id: commentId } });
};

module.exports = { getComments, addComment, deleteComment };
