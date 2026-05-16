const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTaskInsights } = require('../controllers/aiController');
const { authorize } = require('../middlewares/rbacMiddleware');
const { verifyTaskAccess } = require('../middlewares/resourceAccessMiddleware');
const { protect } = require('../middlewares/authMiddleware');

router.get('/insights', protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), getTaskInsights);

module.exports = router;
