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
const commentRoutes = require('./commentRoutes');
const activityRoutes = require('./activityRoutes');

router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.get("/my-tasks", protect, getMyTasks);
router.patch("/:taskId", protect, updateTask);
router.delete("/:taskId", protect, deleteTask);

// Nested routes
router.use('/:taskId/comments', commentRoutes);
router.use('/:taskId/activities', activityRoutes);

module.exports = router;

