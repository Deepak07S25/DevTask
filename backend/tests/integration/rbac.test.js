jest.mock('../../src/db/client');
const prisma = require('../../src/db/client');
const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('RBAC Integration Tests', () => {
  const adminToken = jwt.sign({ userId: 'user-admin' }, process.env.JWT_SECRET || 'supersecretkey');
  const memberToken = jwt.sign({ userId: 'user-member' }, process.env.JWT_SECRET || 'supersecretkey');
  const outsiderToken = jwt.sign({ userId: 'user-outsider' }, process.env.JWT_SECRET || 'supersecretkey');

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock project membership role queries
    prisma.projectMember.findFirst.mockImplementation(({ where }) => {
      const { projectId, userId } = where;
      if (projectId === 'project-uuid-123') {
        if (userId === 'user-admin') {
          return Promise.resolve({ id: 'pm-1', role: 'ADMIN', userId, projectId });
        }
        if (userId === 'user-member') {
          return Promise.resolve({ id: 'pm-2', role: 'MEMBER', userId, projectId });
        }
      }
      return Promise.resolve(null);
    });
  });

  describe('PATCH /api/projects/:id (Project Settings Update)', () => {
    it('should allow ADMIN role to update project details', async () => {
      prisma.project.update.mockResolvedValue({ id: 'project-uuid-123', name: 'Updated Project' });

      const res = await request(app)
        .patch('/api/projects/project-uuid-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Project',
          description: 'New Description',
        });

      expect(res.statusCode).toEqual(200);
      expect(prisma.project.update).toHaveBeenCalledTimes(1);
    });

    it('should reject MEMBER role with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/projects/project-uuid-123')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated Project',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Forbidden: You do not have the required permissions');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should reject non-members with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/projects/project-uuid-123')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          name: 'Updated Project',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Forbidden: No role found for this user in this context');
    });
  });

  describe('POST /api/projects/:id/members (Add Project Members)', () => {
    it('should allow ADMIN role to add new members', async () => {
      const mockNewMember = { id: 'pm-new', role: 'MEMBER', userId: 'user-new', projectId: 'project-uuid-123' };
      prisma.user.findUnique.mockResolvedValue({ id: 'user-new', email: 'new@example.com' });
      prisma.projectMember.create.mockResolvedValue(mockNewMember);
      prisma.project.findUnique.mockResolvedValue({ id: 'project-uuid-123', name: 'Project 1' });

      const res = await request(app)
        .post('/api/projects/project-uuid-123/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@example.com',
        });

      expect(res.statusCode).toEqual(201);
      expect(prisma.projectMember.create).toHaveBeenCalledTimes(1);
    });

    it('should reject MEMBER role when attempting to add members', async () => {
      const res = await request(app)
        .post('/api/projects/project-uuid-123/members')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          email: 'new@example.com',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Forbidden: You do not have the required permissions');
    });
  });

  describe('PATCH /api/tasks/:taskId (Task Details Modification)', () => {
    beforeEach(() => {
      // Mock verifyTaskAccess query to map task to its project
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-uuid-123',
        projectId: 'project-uuid-123',
        assignee: { name: 'Test User' },
        project: { name: 'Project 1' },
      });
    });

    it('should allow ADMIN role to update task details', async () => {
      prisma.task.update.mockResolvedValue({ id: 'task-uuid-123', status: 'Done' });

      const res = await request(app)
        .patch('/api/tasks/task-uuid-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Done',
        });

      expect(res.statusCode).toEqual(200);
      expect(prisma.task.update).toHaveBeenCalled();
    });

    it('should allow MEMBER role to update task details', async () => {
      prisma.task.update.mockResolvedValue({ id: 'task-uuid-123', status: 'In Progress' });

      const res = await request(app)
        .patch('/api/tasks/task-uuid-123')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'In Progress',
        });

      expect(res.statusCode).toEqual(200);
      expect(prisma.task.update).toHaveBeenCalled();
    });

    it('should reject outsider who does not belong to the parent project', async () => {
      const res = await request(app)
        .patch('/api/tasks/task-uuid-123')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          status: 'In Progress',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Forbidden: You do not have access to the project owning this task.');
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });
});
