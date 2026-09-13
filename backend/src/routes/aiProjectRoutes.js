const express = require('express');
const router = express.Router({ mergeParams: true });
const { getProjectHealth, chat, runAgent } = require('../controllers/aiController');
const { authorize, resolveProjectRole } = require('../middlewares/rbacMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { validateSafe } = require('../middlewares/validationMiddleware');
const { agentRequestSchema } = require('../validations/schemas');

router.get('/health', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), getProjectHealth);
router.post('/chat', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), chat);
router.post('/agent', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), validateSafe(agentRequestSchema), runAgent);

module.exports = router;
