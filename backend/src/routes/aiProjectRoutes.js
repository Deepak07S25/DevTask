const express = require('express');
const router = express.Router({ mergeParams: true });
const { getProjectHealth, chat } = require('../controllers/aiController');
const { authorize, resolveProjectRole } = require('../middlewares/rbacMiddleware');
const { protect } = require('../middlewares/authMiddleware');

router.get('/health', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), getProjectHealth);
router.post('/chat', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), chat);

module.exports = router;
