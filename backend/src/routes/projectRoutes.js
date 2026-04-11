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
router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.patch('/:id', protect, resolveProjectRole, authorize('ADMIN'), editProject);
router.delete('/:id', protect, resolveProjectRole, authorize('ADMIN'), deleteProject);

// Member management
router.get('/:id/members', protect, getMembers);
router.post('/:id/members', protect, resolveProjectRole, authorize('ADMIN'), addMember);
router.delete('/:id/members/:userId', protect, resolveProjectRole, authorize('ADMIN'), removeMember);

module.exports = router;
