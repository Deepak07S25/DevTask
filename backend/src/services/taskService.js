const prisma = require('../db/client');

const createTask = async (title, description, projectId, assigneeId, status, priority, dueDate, userId, sprintId, type, epicId) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
            data: {
                title,
                description,
                projectId,
                assigneeId: assigneeId || null,
                status: status || 'TODO',
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                sprintId: sprintId || null,
                type: type || 'TASK',
                epicId: epicId || null,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                sprint: { select: { id: true, name: true, status: true } },
                epic: { select: { id: true, title: true } }
            }
        });

        const activities = [{ taskId: task.id, userId, action: 'created this task' }];
        
        if (dueDate) {
            const dateStr = new Date(dueDate).toISOString().split('T')[0];
            activities.push({ taskId: task.id, userId, action: 'set due date', details: `to ${dateStr}` });
        }

        await tx.taskActivity.createMany({ data: activities });

        return task;
    });
};

const getProjectTasks = async (projectId, sprintId, type, search, assigneeId, priority) => {
    const where = { projectId, deletedAt: null };
    if (sprintId === 'backlog') {
        where.sprintId = null;
    } else if (sprintId) {
        where.sprintId = sprintId;
    }
    if (type) {
        where.type = type;
    }
    // Advanced filters
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (assigneeId) {
        where.assigneeId = assigneeId;
    }
    if (priority) {
        where.priority = priority;
    }
    return await prisma.task.findMany({
        where,
        include: {
            assignee: { select: { id: true, name: true, email: true } },
            sprint: { select: { id: true, name: true, status: true } },
            epic: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' }
    });
};

const updateTask = async (taskId, updateData, userId) => {
    return await prisma.$transaction(async (tx) => {
        const oldTask = await tx.task.findUnique({ where: { id: taskId } });
        if (!oldTask) throw new Error("Task not found");

        const data = {};
        const activities = [];

        if (updateData.title !== undefined && updateData.title !== oldTask.title) {
            data.title = updateData.title;
            activities.push({ taskId, userId, action: 'changed title', details: `from "${oldTask.title}" to "${updateData.title}"` });
        }
        if (updateData.description !== undefined && updateData.description !== oldTask.description) {
            data.description = updateData.description || null;
            activities.push({ taskId, userId, action: updateData.description ? 'updated description' : 'removed description' });
        }
        if (updateData.status !== undefined && updateData.status !== oldTask.status) {
            data.status = updateData.status;
            activities.push({ taskId, userId, action: 'changed status', details: `from ${oldTask.status} to ${updateData.status}` });
        }
        if (updateData.priority !== undefined && updateData.priority !== oldTask.priority) {
            data.priority = updateData.priority;
            activities.push({ taskId, userId, action: 'changed priority', details: `from ${oldTask.priority} to ${updateData.priority}` });
        }
        
        if (updateData.dueDate !== undefined) {
            const newDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
            const oldDate = oldTask.dueDate ? new Date(oldTask.dueDate) : null;
            if (newDate?.getTime() !== oldDate?.getTime()) {
                data.dueDate = newDate;
                activities.push({ taskId, userId, action: newDate ? 'set due date' : 'removed due date', details: newDate ? `to ${newDate.toISOString().split('T')[0]}` : null });
            }
        }

        if (updateData.assigneeId !== undefined && updateData.assigneeId !== oldTask.assigneeId) {
            data.assigneeId = updateData.assigneeId || null;
            activities.push({ taskId, userId, action: data.assigneeId ? 'assigned task' : 'unassigned task' });
        }

        const task = await tx.task.update({
            where: { id: taskId },
            data,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
            }
        });

        if (activities.length > 0) {
            await tx.taskActivity.createMany({ data: activities });
        }

        return task;
    });
};

const deleteTask = async (taskId) => {
    return await prisma.task.delete({
        where: { id: taskId }
    });
};

const getMyTasks = async (userId) => {
    return await prisma.task.findMany({
        where: { assigneeId: userId, deletedAt: null },
        include: {
            project: { select: { id: true, name: true } },
            epic: { select: { id: true, title: true } },
            sprint: { select: { id: true, name: true } },
        },
        orderBy: [
            { dueDate: 'asc' },
            { priority: 'asc' },
            { createdAt: 'desc' },
        ]
    });
};

// Update your exports
module.exports = { createTask, getProjectTasks, getMyTasks, updateTask, deleteTask };