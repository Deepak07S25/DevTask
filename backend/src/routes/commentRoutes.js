const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to get :taskId from parent
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const { verifyTaskAccess } = require('../middlewares/resourceAccessMiddleware');
const { validateSafe } = require('../middlewares/validationMiddleware');
const { createCommentSchema } = require('../validations/schemas');

// GET  /api/tasks/:taskId/comments
router.get('/', protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), getComments);

// POST /api/tasks/:taskId/comments
router.post('/', protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), validateSafe(createCommentSchema), addComment);

// DELETE /api/tasks/:taskId/comments/:commentId
router.delete('/:commentId', protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), deleteComment);

module.exports = router;
