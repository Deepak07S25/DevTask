const prisma = require('../db/client');
const { enqueueNotification } = require('../queues/notificationQueue');
const riskService = require('./riskService');

const createTask = async (title, description, projectId, assigneeId, status, priority, dueDate, userId, sprintId, type, epicId, parentId, rank, labels, blocked, estimatePoints, actualPoints, riskScore, riskLevel, riskReasons) => {
    if (assigneeId) {
        const member = await prisma.projectMember.findFirst({ where: { projectId, userId: assigneeId } });
        if (!member) throw new Error("Assignee must be a member of the project");
    }
    if (sprintId) {
        const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
        if (!sprint || sprint.projectId !== projectId) throw new Error("Sprint must belong to the same project");
    }
    if (epicId) {
        const epic = await prisma.task.findUnique({ where: { id: epicId, type: 'EPIC' } });
        if (!epic || epic.projectId !== projectId) throw new Error("Epic must belong to the same project");
    }

    if (parentId) {
        const parent = await prisma.task.findUnique({ where: { id: parentId } });
        if (!parent || parent.projectId !== projectId) throw new Error("Parent task must belong to the same project");
    }

    const createdTask = await prisma.$transaction(async (tx) => {
        const maxTask = await tx.task.aggregate({
            where: { projectId },
            _max: { taskNumber: true }
        });
        const taskNumber = (maxTask._max.taskNumber || 0) + 1;

        const data = {
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
            parentId: parentId || null,
            rank: rank !== undefined ? rank : 0,
            taskNumber,
            blocked: blocked || false,
            estimatePoints: estimatePoints !== undefined ? estimatePoints : null,
            actualPoints: actualPoints !== undefined ? actualPoints : null,
            riskScore: riskScore !== undefined ? riskScore : null,
            riskLevel: riskLevel !== undefined ? riskLevel : 'NONE',
            riskReasons: riskReasons !== undefined ? riskReasons : null
        };

        if (labels && labels.length > 0) {
            data.labels = {
                create: labels.map(labelName => {
                    const normalizedName = labelName.trim().toLowerCase();
                    return {
                        label: {
                            connectOrCreate: {
                                where: { projectId_name: { projectId, name: normalizedName } },
                                create: { projectId, name: normalizedName }
                            }
                        }
                    };
                })
            };
        }

        const txCreatedTask = await tx.task.create({
            data,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                sprint: { select: { id: true, name: true, status: true } },
                epic: { select: { id: true, title: true } },
                labels: { include: { label: true } },
                project: { select: { key: true } }
            }
        });



        const activities = [{ taskId: txCreatedTask.id, userId, action: 'created this task' }];
        
        if (dueDate) {
            const dateStr = new Date(dueDate).toISOString().split('T')[0];
            activities.push({ taskId: txCreatedTask.id, userId, action: 'set due date', details: `to ${dateStr}` });
        }

        await tx.taskActivity.createMany({ data: activities });

        if (assigneeId && assigneeId !== userId) {
            await enqueueNotification('TASK_ASSIGNED', {
                recipientId: assigneeId,
                actorId: userId,
                data: {
                    entityId: txCreatedTask.id,
                    entityTitle: txCreatedTask.title,
                    projectId: txCreatedTask.projectId,
                    link: `/project/${txCreatedTask.projectId}`
                }
            });
        }

        return txCreatedTask;
    });

    try {
        const riskUpdatedTask = await riskService.updateTaskRisk(createdTask.id);
        Object.assign(createdTask, riskUpdatedTask);
    } catch (error) {
        console.error("Failed to calculate AI risk on create:", error);
        throw new Error("Failed to calculate AI risk on create");
    }
    
    return createdTask;
};

const getProjectTasks = async (projectId, sprintId, type, search, assigneeId, priority, page = 1, limit = 100) => {
    const where = { projectId };
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
            { title: { contains: search } },
            { description: { contains: search } },
        ];
    }
    if (assigneeId) {
        where.assigneeId = assigneeId;
    }
    if (priority) {
        where.priority = priority;
    }
    
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 100, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const [tasks, totalCount] = await Promise.all([
        prisma.task.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                sprint: { select: { id: true, name: true, status: true } },
                epic: { select: { id: true, title: true } },
                labels: { include: { label: true } },
                project: { select: { key: true } }
            },
            orderBy: [
                { rank: 'asc' },
                { createdAt: 'desc' }
            ],
            take,
            skip
        }),
        prisma.task.count({ where })
    ]);

    return { data: tasks, meta: { totalCount, totalPages: Math.ceil(totalCount / take) } };
};

const updateTask = async (taskId, updateData, userId) => {
    let relevantFieldsChanged = false;
    
    const updatedTask = await prisma.$transaction(async (tx) => {
        const oldTask = await tx.task.findUnique({ where: { id: taskId } });
        if (!oldTask) throw new Error("Task not found");

        if (updateData.assigneeId && updateData.assigneeId !== oldTask.assigneeId) {
            const member = await tx.projectMember.findFirst({ where: { projectId: oldTask.projectId, userId: updateData.assigneeId } });
            if (!member) throw new Error("Assignee must be a member of the project");
        }

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
        
        if (updateData.blocked !== undefined && updateData.blocked !== oldTask.blocked) {
            data.blocked = updateData.blocked;
            activities.push({ taskId, userId, action: updateData.blocked ? 'marked task as blocked' : 'removed block' });
        }
        if (updateData.estimatePoints !== undefined && updateData.estimatePoints !== oldTask.estimatePoints) {
            data.estimatePoints = updateData.estimatePoints;
            activities.push({ taskId, userId, action: 'updated estimate' });
        }
        if (updateData.actualPoints !== undefined && updateData.actualPoints !== oldTask.actualPoints) {
            data.actualPoints = updateData.actualPoints;
            activities.push({ taskId, userId, action: 'updated actual points' });
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

        if (updateData.parentId !== undefined) {
            if (updateData.parentId === taskId) throw new Error("Task cannot be its own parent");
            if (updateData.parentId) {
                const parent = await tx.task.findUnique({ where: { id: updateData.parentId } });
                if (!parent || parent.projectId !== oldTask.projectId) throw new Error("Parent task must belong to the same project");
            }
            data.parentId = updateData.parentId || null;
            activities.push({ taskId, userId, action: data.parentId ? 'changed parent task' : 'removed parent task' });
        }
        if (updateData.rank !== undefined && updateData.rank !== oldTask.rank) {
            data.rank = updateData.rank;
        }
        
        if (updateData.labels !== undefined) {
            await tx.taskLabel.deleteMany({ where: { taskId } });
            if (updateData.labels.length > 0) {
                data.labels = {
                    create: updateData.labels.map(labelName => {
                        const normalizedName = labelName.trim().toLowerCase();
                        return {
                            label: {
                                connectOrCreate: {
                                    where: { projectId_name: { projectId: oldTask.projectId, name: normalizedName } },
                                    create: { projectId: oldTask.projectId, name: normalizedName }
                                }
                            }
                        };
                    })
                };
            }
            activities.push({ taskId, userId, action: 'updated labels' });
        }

        const task = await tx.task.update({
            where: { id: taskId },
            data,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                labels: { include: { label: true } },
                project: { select: { key: true } }
            }
        });

        if (activities.length > 0) {
            await tx.taskActivity.createMany({ data: activities });
        }

        if (updateData.assigneeId && updateData.assigneeId !== oldTask.assigneeId && updateData.assigneeId !== userId) {
            await enqueueNotification('TASK_ASSIGNED', {
                recipientId: updateData.assigneeId,
                actorId: userId,
                data: {
                    entityId: task.id,
                    entityTitle: task.title,
                    projectId: task.projectId,
                    link: `/project/${task.projectId}`
                }
            });
        } else if (activities.length > 0 && oldTask.assigneeId && oldTask.assigneeId !== userId) {
            await enqueueNotification('TASK_UPDATED', {
                recipientId: oldTask.assigneeId,
                actorId: userId,
                data: {
                    entityId: task.id,
                    entityTitle: task.title,
                    projectId: task.projectId,
                    link: `/project/${task.projectId}`
                }
            });
        }

        // Determine if risk calculation is needed
        const relevantFields = ['dueDate', 'blocked', 'priority', 'assigneeId', 'description', 'status', 'estimatePoints', 'actualPoints'];
        if (relevantFields.some(field => updateData[field] !== undefined)) {
            relevantFieldsChanged = true;
        }

        return task;
    });

    if (relevantFieldsChanged) {
        try {
            const riskUpdatedTask = await riskService.updateTaskRisk(updatedTask.id);
            Object.assign(updatedTask, riskUpdatedTask);
        } catch (error) {
            console.error("Failed to calculate AI risk on update:", error);
            throw new Error("Failed to calculate AI risk on update");
        }
    }

    return updatedTask;
};

const deleteTask = async (taskId) => {
    return await prisma.task.delete({
        where: { id: taskId }
    });
};

const getMyTasks = async (userId, page = 1, limit = 100) => {
    const where = { assigneeId: userId };
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 100, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const [tasks, totalCount] = await Promise.all([
        prisma.task.findMany({
            where,
            include: {
                project: { select: { id: true, name: true, key: true } },
                epic: { select: { id: true, title: true } },
                sprint: { select: { id: true, name: true } },
                labels: { include: { label: true } }
            },
            orderBy: [
                { rank: 'asc' },
                { dueDate: 'asc' },
                { priority: 'asc' },
                { createdAt: 'desc' },
            ],
            take,
            skip
        }),
        prisma.task.count({ where })
    ]);

    return { data: tasks, meta: { totalCount, totalPages: Math.ceil(totalCount / take) } };
};

// Update your exports
module.exports = { createTask, getProjectTasks, getMyTasks, updateTask, deleteTask };