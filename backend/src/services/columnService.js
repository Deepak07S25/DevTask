const prisma = require('../db/client');

const getColumns = async (projectId) => {
    return await prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
    });
};

const createColumn = async (projectId, name, color) => {
    const last = await prisma.boardColumn.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
    });
    return await prisma.boardColumn.create({
        data: { name, color: color || '#6366f1', order: (last?.order ?? -1) + 1, projectId },
    });
};

const updateColumn = async (columnId, data) => {
    const existing = await prisma.boardColumn.findUnique({ where: { id: columnId } });
    const updated = await prisma.boardColumn.update({
        where: { id: columnId },
        data,
    });
    // If name changed, update tasks status
    if (data.name && existing.name !== data.name) {
        await prisma.task.updateMany({
            where: { status: existing.name, projectId: existing.projectId },
            data: { status: data.name },
        });
    }
    return updated;
};

const deleteColumn = async (columnId, fallbackColumnId) => {
    const columnToDelete = await prisma.boardColumn.findUnique({ where: { id: columnId } });
    if (!columnToDelete) return;

    if (fallbackColumnId) {
        const fallbackColumn = await prisma.boardColumn.findUnique({ where: { id: fallbackColumnId } });
        if (fallbackColumn) {
            await prisma.task.updateMany({
                where: { status: columnToDelete.name, projectId: columnToDelete.projectId },
                data: { status: fallbackColumn.name },
            });
        }
    }
    return await prisma.boardColumn.delete({ where: { id: columnId } });
};

const reorderColumns = async (projectId, orderedIds) => {
    const updates = orderedIds.map((id, index) =>
        prisma.boardColumn.update({ where: { id }, data: { order: index } })
    );
    return await prisma.$transaction(updates);
};

module.exports = { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns };
