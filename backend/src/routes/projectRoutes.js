const express = require('express');
const router = express.Router();
const {
    createProject, getProjects, getProjectById,
    editProject, deleteProject,
    getMembers, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, resolveProjectRole } = require('../middlewares/rbacMiddleware');

// Project CRUD
const { validateSafe } = require("../middlewares/validationMiddleware");
const { createProjectSchema, editProjectSchema, addMemberSchema } = require("../validations/schemas");

router.post('/', protect, validateSafe(createProjectSchema), createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.patch('/:id', protect, resolveProjectRole, authorize('ADMIN'), validateSafe(editProjectSchema), editProject);
router.delete('/:id', protect, resolveProjectRole, authorize('ADMIN'), deleteProject);

// Member management
router.get('/:id/members', protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), getMembers);
router.post('/:id/members', protect, resolveProjectRole, authorize('ADMIN'), validateSafe(addMemberSchema), addMember);
router.delete('/:id/members/:userId', protect, resolveProjectRole, authorize('ADMIN'), removeMember);

const columnRoutes = require('./columnRoutes');
router.use('/:projectId/columns', columnRoutes);

const aiProjectRoutes = require('./aiProjectRoutes');
router.use('/:id/ai', aiProjectRoutes);

module.exports = router;
