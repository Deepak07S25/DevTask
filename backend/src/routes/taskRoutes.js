const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize, resolveProjectRole } = require("../middlewares/rbacMiddleware");
const { verifyTaskAccess } = require("../middlewares/resourceAccessMiddleware");
const { validateSafe } = require("../middlewares/validationMiddleware");
const { createTaskSchema, updateTaskSchema } = require("../validations/schemas");

const commentRoutes = require('./commentRoutes');
const activityRoutes = require('./activityRoutes');

router.post("/", protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), validateSafe(createTaskSchema), createTask);
router.get("/", protect, resolveProjectRole, authorize('ADMIN', 'MEMBER'), getTasks);
router.get("/my-tasks", protect, getMyTasks);
router.patch("/:taskId", protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), validateSafe(updateTaskSchema), updateTask);
router.delete("/:taskId", protect, verifyTaskAccess, authorize('ADMIN', 'MEMBER'), deleteTask);

// Nested routes
router.use('/:taskId/comments', commentRoutes);
router.use('/:taskId/activities', activityRoutes);

module.exports = router;

