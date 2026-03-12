const columnService = require('../services/columnService');

const getColumns = async (req, res) => {
    try {
        const columns = await columnService.getColumns(req.params.projectId);
        res.json(columns);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const createColumn = async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Column name is required' });
        const col = await columnService.createColumn(req.params.projectId, name.trim(), color);
        res.status(201).json(col);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const updateColumn = async (req, res) => {
    try {
        const { name, color, order } = req.body;
        const col = await columnService.updateColumn(req.params.columnId, {
            ...(name !== undefined && { name }),
            ...(color !== undefined && { color }),
            ...(order !== undefined && { order }),
        });
        res.json(col);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteColumn = async (req, res) => {
    try {
        const { fallbackColumnId } = req.body;
        await columnService.deleteColumn(req.params.columnId, fallbackColumnId);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const reorderColumns = async (req, res) => {
    try {
        const { orderedIds } = req.body;
        const result = await columnService.reorderColumns(req.params.projectId, orderedIds);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns };
