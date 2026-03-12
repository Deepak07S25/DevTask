const express = require('express');
const router = express.Router();
const {
    createProject, getProjects, getProjectById,
    editProject, deleteProject,
    getMembers, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');


// Project CRUD
router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.patch('/:id', protect, editProject);
router.delete('/:id', protect, deleteProject);

// Member management
router.get('/:id/members', protect, getMembers);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
