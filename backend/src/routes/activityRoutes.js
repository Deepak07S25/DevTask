const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTaskActivities } = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getTaskActivities);

module.exports = router;
