const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to get :taskId from parent
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

// GET  /api/tasks/:taskId/comments
router.get('/', protect, getComments);

// POST /api/tasks/:taskId/comments
router.post('/', protect, addComment);

// DELETE /api/tasks/:taskId/comments/:commentId
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
