const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to get :projectId
const { protect } = require('../middlewares/authMiddleware');
const {
    getColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
} = require('../controllers/columnController');

router.get('/', protect, getColumns);
router.post('/', protect, createColumn);
router.patch('/reorder', protect, reorderColumns);
router.patch('/:columnId', protect, updateColumn);
router.delete('/:columnId', protect, deleteColumn);

module.exports = router;
