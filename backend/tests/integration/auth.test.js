jest.mock('../../src/db/client');
const prisma = require('../../src/db/client');
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      prisma.user.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('userId', 'user-uuid-123');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when registration fails due to duplicate email or db error', async () => {
      prisma.user.create.mockRejectedValue(new Error('Email already registered'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should validate inputs using Zod schema constraints', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          name: '',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user with correct credentials and set cookies', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=');
    });

    it('should return 401 for incorrect password credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve profile details when authenticated with valid token', async () => {
      const mockUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign({ userId: 'user-uuid-123' }, process.env.JWT_SECRET || 'supersecretkey');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123' },
        select: { id: true, name: true, email: true, createdAt: true },
      });
    });

    it('should block query access with HTTP 401 when no token is attached', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Not authorized, no token');
    });
  });

  describe('PATCH /api/auth/me/password', () => {
    it('should update password successfully when correct validation matches', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPassword123!', 10);
      const mockUser = {
        id: 'user-uuid-123',
        password: hashedOldPassword,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ id: 'user-uuid-123' });

      const token = jwt.sign({ userId: 'user-uuid-123' }, process.env.JWT_SECRET || 'supersecretkey');

      const res = await request(app)
        .patch('/api/auth/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!!',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Password updated successfully');
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('should return 401 error if currentPassword verify fails', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPassword123!', 10);
      const mockUser = {
        id: 'user-uuid-123',
        password: hashedOldPassword,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign({ userId: 'user-uuid-123' }, process.env.JWT_SECRET || 'supersecretkey');

      const res = await request(app)
        .patch('/api/auth/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Current password is incorrect');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully clear JWT cookie parameters on logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
      expect(res.headers['set-cookie'][0]).toContain('token=;');
    });
  });
});
