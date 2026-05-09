require('dotenv').config();
const prisma = require('../src/db/client');

async function main() {
    const projects = await prisma.project.findMany({
        include: { boardColumns: true }
    });

    for (const project of projects) {
        if (project.boardColumns.length === 0) {
            console.log(`Seeding columns for project ${project.name}`);
            await prisma.boardColumn.createMany({
                data: [
                    { name: 'To Do', color: '#6b7280', order: 0, projectId: project.id },
                    { name: 'In Progress', color: '#3b82f6', order: 1, projectId: project.id },
                    { name: 'Done', color: '#22c55e', order: 2, projectId: project.id }
                ]
            });
            // Update tasks with old status string if it matches
            await prisma.task.updateMany({
                where: { projectId: project.id, status: 'TODO' },
                data: { status: 'To Do' }
            });
            await prisma.task.updateMany({
                where: { projectId: project.id, status: 'IN_PROGRESS' },
                data: { status: 'In Progress' }
            });
            await prisma.task.updateMany({
                where: { projectId: project.id, status: 'DONE' },
                data: { status: 'Done' }
            });
        }
    }
    console.log('Seeding done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
