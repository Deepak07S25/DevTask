const prisma = require('../db/client');

const createProject = async (name, description, userId) => {
    // We use a "Transaction" or nested create to make the creator an ADMIN
    return await prisma.project.create({
        data: {
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

const getUserProjects = async (userId) => {
    return await prisma.project.findMany({
        where: {
            members: {
                some: { userId: userId }
            }
        }
    });
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

const getMembers = async (projectId) => {
    return await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { role: 'asc' }
    });
};

const addMemberByEmail = async (projectId, requesterId, email) => {
    // Authorization is now handled by the rbacMiddleware at the routing layer
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) throw new Error(`No user found with email: ${email}`);
    const existing = await prisma.projectMember.findFirst({
        where: { projectId, userId: userToAdd.id }
    });
    if (existing) throw new Error('User is already a member of this project');
    return await prisma.projectMember.create({
        data: { projectId, userId: userToAdd.id, role: 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true } } }
    });
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
