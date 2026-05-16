const prisma = require("../../db/client");

class ContextBuilder {
  static async buildProjectContext(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: { select: { name: true, email: true } },
          },
        },
        members: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!project) throw new Error("Project not found");

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      totalTasks: project.tasks.length,
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        blocked: t.blocked,
        assignee: t.assignee ? t.assignee.name : "Unassigned",
        hasDescription: !!t.description,
      })),
      members: project.members.map((m) => ({
        role: m.role,
        name: m.user.name,
      })),
    };
  }

  static async buildTaskContext(taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    if (!task) throw new Error("Task not found");

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      blocked: task.blocked,
      assignee: task.assignee ? task.assignee.name : "Unassigned",
      projectName: task.project.name,
    };
  }
}

module.exports = ContextBuilder;
