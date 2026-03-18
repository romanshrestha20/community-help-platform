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
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require('../src/utils/prisma');
const app = require('../src/app');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register with valid data and return 201 with tokens', async () => {
      const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        role: 'REQUESTER',
        phone: null,
        passwordHash: 'hashed',
        profile: { id: 'profile-1', userId: 'user-id-1', fullName: 'Test User', address: null },
      };

      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123', fullName: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123', fullName: 'Test User' });

      expect(res.status).toBe(409);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password123', fullName: 'Test User' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for weak password (less than 8 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'short', fullName: 'Test User' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return 200 with tokens', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id-1',
        email: 'test@example.com',
        passwordHash,
        role: 'REQUESTER',
        profile: { fullName: 'Test User' },
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for wrong password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id-1',
        email: 'test@example.com',
        passwordHash,
        role: 'REQUESTER',
        profile: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 and new access token for valid refresh token', async () => {
      const token = jwt.sign({ userId: 'user-id-1' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token,
        userId: 'user-id-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id-1', role: 'REQUESTER' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: token });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid/revoked refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully and return 200', async () => {
      const accessToken = jwt.sign({ userId: 'user-id-1', role: 'REQUESTER' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'some-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});
