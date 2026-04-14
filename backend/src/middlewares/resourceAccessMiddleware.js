const prisma = require("../db/client");

/**
 * Synthesizes role-based access control for nested Task resources.
 * This looks up the parent project of the given task, then asserts
 * if the authenticated user is actually a member of that project.
 */
const verifyTaskAccess = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    
    // Fallback logic for how protect middleware maps req.user
    const userId = typeof req.user === 'object' ? req.user.id : req.user;

    if (!taskId || !userId) {
       // Allow controller or generic validation to handle malformed requests
       return next();
    }

    // We must find the task to know what project it belongs to
    // Using select ensures optimal database performance
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true }
    });

    // If the task doesn't exist, we can't authorize it.
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Verify the user is a registered member of the project the task sits in
    const membership = await prisma.projectMember.findFirst({
      where: { 
        projectId: task.projectId, 
        userId: userId 
      }
    });

    if (!membership) {
      return res.status(403).json({ 
        error: "Forbidden: You do not have access to the project owning this task." 
      });
    }

    // Synthesize the role onto the request object so the generic authorization middleware can read it
    req.userRole = membership.role;
    next();
  } catch (error) {
    console.error('[verifyTaskAccess ERROR]', error.message);
    next(error);
  }
};

module.exports = { verifyTaskAccess };

/**
 * Synthesizes role-based access control for nested Sprint resources.
 */
const verifySprintAccess = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    const userId = typeof req.user === 'object' ? req.user.id : req.user;

    if (!sprintId || !userId) {
       return next();
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { projectId: true }
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const membership = await prisma.projectMember.findFirst({
      where: { 
        projectId: sprint.projectId, 
        userId: userId 
      }
    });

    if (!membership) {
      return res.status(403).json({ 
        error: "Forbidden: You do not have access to the project owning this sprint." 
      });
    }

    req.userRole = membership.role;
    next();
  } catch (error) {
    console.error('[verifySprintAccess ERROR]', error.message);
    next(error);
  }
};

module.exports = { verifyTaskAccess, verifySprintAccess };
