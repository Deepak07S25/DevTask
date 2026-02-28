const prisma = require('../db/client');

const getComments = async (taskId) => {
    return await prisma.comment.findMany({
        where: { taskId },
        include: {
            author: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    });
};

const addComment = async (taskId, authorId, body) => {
    return await prisma.comment.create({
        data: { body, taskId, authorId },
        include: {
            author: {
                select: { id: true, name: true, email: true }
            }
        }
    });
};

const deleteComment = async (commentId, authorId) => {
    // Only allow the author to delete their own comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    if (comment.authorId !== authorId) throw new Error('Not authorized to delete this comment');
    return await prisma.comment.delete({ where: { id: commentId } });
};

module.exports = { getComments, addComment, deleteComment };
