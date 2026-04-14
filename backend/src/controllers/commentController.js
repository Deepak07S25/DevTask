const commentService = require('../services/commentService');
const asyncHandler = require('../middlewares/asyncHandler');

const getComments = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { page, limit } = req.query;
    const { data, meta } = await commentService.getComments(taskId, page, limit);
    res.set('X-Total-Count', meta.totalCount);
    res.set('X-Total-Pages', meta.totalPages);
    res.status(200).json(data);
});

const addComment = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { body } = req.body;
    if (!body || !body.trim()) {
        const error = new Error('Comment body cannot be empty');
        error.statusCode = 400;
        throw error;
    }
    const comment = await commentService.addComment(taskId, req.user, body.trim());
    res.status(201).json(comment);
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    await commentService.deleteComment(commentId, req.user);
    res.status(200).json({ message: 'Comment deleted' });
});

module.exports = { getComments, addComment, deleteComment };
