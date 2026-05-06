const prisma = require('../db/client');
const { enqueueNotification } = require('../queues/notificationQueue');

const createProject = async (key, name, description, userId) => {
    // We use a "Transaction" or nested create to make the creator an ADMIN
    return await prisma.project.create({
        data: {
            key,
            name,
            description,
            members: {
                create: {
                    userId: userId,
                    role: 'ADMIN' // The creator is the boss
                }
            }
        }
    });
};

const getUserProjects = async (userId, page = 1, limit = 100) => {
    const where = {
        members: {
            some: { userId: userId }
        }
    };
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 100, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const [projects, totalCount] = await Promise.all([
        prisma.project.findMany({ where, take, skip }),
        prisma.project.count({ where })
    ]);

    return { data: projects, meta: { totalCount, totalPages: Math.ceil(totalCount / take) } };
};

const getProjectById = async (projectId, userId) => {
    return await prisma.project.findFirst({
        where: {
            id: projectId,
            members: {
                some: { userId: userId }
            }
        }
    });
};

module.exports = { createProject, getUserProjects, getProjectById };

const updateProject = async (projectId, userId, data) => {
    // Authorization is now handled by the rbacMiddleware at the routing layer
    return await prisma.project.update({
        where: { id: projectId },
        data: { name: data.name, description: data.description }
    });
};

const deleteProject = async (projectId, userId) => {
    // Authorization is now handled by the rbacMiddleware at the routing layer
    return await prisma.project.delete({ where: { id: projectId } });
};

const getMembers = async (projectId, page = 1, limit = 100) => {
    const where = { projectId };
    const take = Math.max(1, Math.min(parseInt(limit, 10) || 100, 100));
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take) || 0;

    const [members, totalCount] = await Promise.all([
        prisma.projectMember.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { role: 'asc' },
            take,
            skip
        }),
        prisma.projectMember.count({ where })
    ]);

    return { data: members, meta: { totalCount, totalPages: Math.ceil(totalCount / take) } };
};

const addMemberByEmail = async (projectId, requesterId, email) => {
    // Authorization is now handled by the rbacMiddleware at the routing layer
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) throw new Error(`No user found with email: ${email}`);
    const existing = await prisma.projectMember.findFirst({
        where: { projectId, userId: userToAdd.id }
    });
    if (existing) throw new Error('User is already a member of this project');
    const project = await prisma.project.findUnique({ where: { id: projectId }});
    
    const newMember = await prisma.projectMember.create({
        data: { projectId, userId: userToAdd.id, role: 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    await enqueueNotification('PROJECT_ASSIGNED', {
        recipientId: userToAdd.id,
        actorId: requesterId,
        data: {
            entityId: project.id,
            entityTitle: project.name,
            link: '/dashboard'
        }
    });

    return newMember;
};

const removeMember = async (projectId, requesterId, memberUserId) => {
    // Authorization is now handled by the rbacMiddleware at the routing layer
    if (requesterId === memberUserId) throw new Error('Cannot remove yourself as ADMIN');
    const member = await prisma.projectMember.findFirst({
        where: { projectId, userId: memberUserId }
    });
    if (!member) throw new Error('Member not found');
    return await prisma.projectMember.delete({ where: { id: member.id } });
};

module.exports = {
    createProject, getUserProjects, getProjectById,
    updateProject, deleteProject,
    getMembers, addMemberByEmail, removeMember
};
