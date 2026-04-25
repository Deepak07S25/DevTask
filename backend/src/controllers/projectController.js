const projectService = require('../services/projectService');

const createProject = async (req, res) => {
    try {
        const { key, name, description } = req.body;
        const project = await projectService.createProject(key, name, description, req.user);
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProjects = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const { data, meta } = await projectService.getUserProjects(req.user, page, limit);
        res.set('X-Total-Count', meta.totalCount);
        res.set('X-Total-Pages', meta.totalPages);
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectService.getProjectById(id, req.user);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const editProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectService.updateProject(id, req.user, req.body);
        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await projectService.deleteProject(id, req.user);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;
        const { data, meta } = await projectService.getMembers(id, page, limit);
        res.set('X-Total-Count', meta.totalCount);
        res.set('X-Total-Pages', meta.totalPages);
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const member = await projectService.addMemberByEmail(id, req.user, email);
        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        await projectService.removeMember(id, req.user, userId);
        res.status(200).json({ message: 'Member removed' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createProject, getProjects, getProjectById,
    editProject, deleteProject,
    getMembers, addMember, removeMember
};