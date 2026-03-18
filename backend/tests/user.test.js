process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  profile: {
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require('../src/utils/prisma');
const app = require('../src/app');

const makeToken = (userId = 'user-id-1', role = 'REQUESTER') =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });

    it('should return 200 and profile with valid auth', async () => {
      const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        role: 'REQUESTER',
        passwordHash: 'hashed',
        profile: { id: 'p-1', fullName: 'Test User', bio: 'Hello' },
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update profile and return 200', async () => {
      const updatedProfile = {
        id: 'p-1',
        userId: 'user-id-1',
        fullName: 'Updated Name',
        bio: 'New bio',
      };
      prisma.profile.update.mockResolvedValue(updatedProfile);

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ fullName: 'Updated Name', bio: 'New bio' });

      expect(res.status).toBe(200);
      expect(res.body.profile.fullName).toBe('Updated Name');
    });
  });

  describe('PUT /api/v1/users/password', () => {
    it('should change password with valid data and return 200', async () => {
      const passwordHash = await bcrypt.hash('oldpassword', 10);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id-1', passwordHash });
      prisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password updated successfully');
    });

    it('should return 401 with wrong current password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id-1', passwordHash });

      const res = await request(app)
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return 200 with public profile for valid user id', async () => {
      const mockUser = {
        id: 'user-id-2',
        email: 'other@example.com',
        passwordHash: 'hashed',
        role: 'HELPER',
        createdAt: new Date().toISOString(),
        profile: { id: 'p-2', fullName: 'Other User', bio: 'Helper bio' },
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/users/user-id-2')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe('user-id-2');
      expect(res.body.user).not.toHaveProperty('email');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });
  });
});
