jest.mock('../../src/db/client');
jest.mock('../../src/services/ai/providers/geminiProvider');

const prisma = require('../../src/db/client');
const geminiProvider = require('../../src/services/ai/providers/geminiProvider');
const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('Agent API Integration Tests (POST /api/projects/:id/ai/agent)', () => {
  const secret = process.env.JWT_SECRET || 'devtask_local_dev_secret_do_not_use_in_production_32chars';
  const memberToken = jwt.sign({ userId: 'user-member' }, secret);
  const outsiderToken = jwt.sign({ userId: 'user-outsider' }, secret);

  const projectId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock project membership role queries
    prisma.projectMember.findFirst.mockImplementation(({ where }) => {
      if (where.projectId === projectId) {
        if (where.userId === 'user-member') {
          return Promise.resolve({ id: 'pm-1', role: 'MEMBER', userId: 'user-member', projectId });
        }
      }
      return Promise.resolve(null);
    });

    prisma.project.findFirst.mockImplementation(({ where }) => {
      if (where.id === projectId) {
        return Promise.resolve({ id: projectId, key: 'TEST', name: 'Test Project' });
      }
      return Promise.resolve(null);
    });
  });

  it('should allow authorized project MEMBER to invoke agent and receive response', async () => {
    geminiProvider.generateAgentTurn.mockResolvedValueOnce({
      text: 'Analysis of project TEST complete. All systems look good.',
      functionCalls: null,
    });

    const res = await request(app)
      .post(`/api/projects/${projectId}/ai/agent`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        message: 'Analyze current project state',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('Analysis of project TEST complete');
    expect(res.body.data.metadata.terminationReason).toBe('COMPLETED');
  });

  it('should reject outsider who is not a member with HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/ai/agent`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        message: 'Analyze current project state',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(geminiProvider.generateAgentTurn).not.toHaveBeenCalled();
  });

  it('should reject unauthenticated request with HTTP 401 Unauthorized', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/ai/agent`)
      .send({
        message: 'Analyze current project state',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should reject empty message with HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/ai/agent`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        message: '',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
