const express = require('express');
const router = express.Router();
const {
    createSprint,
    getProjectSprints,
    updateSprint,
    deleteSprint,
    addTaskToSprint,
    removeTaskFromSprint
} = require('../controllers/sprintController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createSprint);
router.get('/', protect, getProjectSprints);
router.patch('/:sprintId', protect, updateSprint);
router.delete('/:sprintId', protect, deleteSprint);

// Task ↔ Sprint assignment
router.patch('/:sprintId/tasks/:taskId', protect, addTaskToSprint);
router.delete('/:sprintId/tasks/:taskId', protect, removeTaskFromSprint);

module.exports = router;
