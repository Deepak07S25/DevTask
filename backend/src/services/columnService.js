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
    return await prisma.boardColumn.update({
        where: { id: columnId },
        data,
    });
};

const deleteColumn = async (columnId, fallbackColumnId) => {
    // Move all tasks in this column to the fallback column before deleting
    if (fallbackColumnId) {
        await prisma.task.updateMany({
            where: { columnId },
            data: { columnId: fallbackColumnId },
        });
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
