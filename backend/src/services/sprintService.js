const prisma = require('../db/client');

const createSprint = async (projectId, name, goal, startDate, endDate) => {
    return await prisma.sprint.create({
        data: {
            projectId,
            name,
            goal: goal || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: 'PLANNED',
        },
        include: { _count: { select: { tasks: true } } }
    });
};

const getProjectSprints = async (projectId) => {
    return await prisma.sprint.findMany({
        where: { projectId },
        include: {
            tasks: {
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    labels: { include: { label: true } },
                    project: { select: { key: true } }
                },
                orderBy: [
                    { rank: 'asc' },
                    { createdAt: 'desc' }
                ]
            },
            _count: { select: { tasks: true } }
        },
        orderBy: { createdAt: 'asc' }
    });
};

const updateSprint = async (sprintId, data) => {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.goal !== undefined) updateData.goal = data.goal || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    return await prisma.sprint.update({
        where: { id: sprintId },
        data: updateData,
        include: { _count: { select: { tasks: true } } }
    });
};

const deleteSprint = async (sprintId) => {
    // Move tasks back to backlog before deleting
    await prisma.task.updateMany({
        where: { sprintId },
        data: { sprintId: null }
    });
    return await prisma.sprint.delete({ where: { id: sprintId } });
};

const addTaskToSprint = async (taskId, sprintId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!task || !sprint) throw new Error("Task or Sprint not found");
    if (task.projectId !== sprint.projectId) throw new Error("Task and Sprint must belong to the same project");

    return await prisma.task.update({
        where: { id: taskId },
        data: { sprintId },
        include: {
            assignee: { select: { id: true, name: true, email: true } }
        }
    });
};

const removeTaskFromSprint = async (taskId) => {
    return await prisma.task.update({
        where: { id: taskId },
        data: { sprintId: null },
        include: {
            assignee: { select: { id: true, name: true, email: true } }
        }
    });
};

module.exports = {
    createSprint,
    getProjectSprints,
    updateSprint,
    deleteSprint,
    addTaskToSprint,
    removeTaskFromSprint
};
