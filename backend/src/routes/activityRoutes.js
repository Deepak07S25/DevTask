const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTaskActivities } = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const { verifyTaskAccess } = require('../middlewares/resourceAccessMiddleware');

router.get('/', protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), getTaskActivities);

module.exports = router;
