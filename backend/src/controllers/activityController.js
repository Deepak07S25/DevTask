const prisma = require('../db/client');

const getTaskActivities = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        const activities = await prisma.taskActivity.findMany({
            where: { taskId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.status(200).json(activities);
    } catch (error) {
        console.error('[getTaskActivities error]', error.message);
        res.status(500).json({ error: 'Failed to fetch task activities' });
    }
};

module.exports = { getTaskActivities };
