const commentService = require('../services/commentService');

const getComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await commentService.getComments(taskId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { body } = req.body;
        if (!body || !body.trim()) {
            return res.status(400).json({ error: 'Comment body cannot be empty' });
        }
        const comment = await commentService.addComment(taskId, req.user, body.trim());
        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        await commentService.deleteComment(commentId, req.user);
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

module.exports = { getComments, addComment, deleteComment };
