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
const { authorize, resolveProjectRole } = require('../middlewares/rbacMiddleware');
const { verifySprintAccess, verifyTaskAccess } = require('../middlewares/resourceAccessMiddleware');
const { validateSafe } = require('../middlewares/validationMiddleware');
const { createSprintSchema, updateSprintSchema } = require('../validations/schemas');

router.post('/', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), validateSafe(createSprintSchema), createSprint);
router.get('/', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), getProjectSprints);
router.patch('/:sprintId', protect, verifySprintAccess, authorize('ADMIN', 'MEMBER'), validateSafe(updateSprintSchema), updateSprint);
router.delete('/:sprintId', protect, verifySprintAccess, authorize('ADMIN', 'MEMBER'), deleteSprint);

// Task ↔ Sprint assignment
router.patch('/:sprintId/tasks/:taskId', protect, verifySprintAccess, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), addTaskToSprint);
router.delete('/:sprintId/tasks/:taskId', protect, verifySprintAccess, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), removeTaskFromSprint);

module.exports = router;
