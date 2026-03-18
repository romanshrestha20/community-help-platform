const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn });
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  return { token, expiresAt };
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: { message: errors.array()[0].msg, status: 422 } });
    }

    const { email, password, fullName, phone, address } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Email already in use', status: 409 } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          phone: phone || null,
          profile: {
            create: {
              fullName,
              address: address || null,
            },
          },
        },
        include: { profile: true },
      });
      return newUser;
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const { token: refreshTokenValue, expiresAt } = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: { message: errors.array()[0].msg, status: 422 } });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid email or password', status: 401 } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { message: 'Invalid email or password', status: 401 } });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const { token: refreshTokenValue, expiresAt } = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({ error: { message: 'Refresh token required', status: 401 } });
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: { message: 'Invalid or expired refresh token', status: 401 } });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: { message: 'Invalid or expired refresh token', status: 401 } });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found', status: 401 } });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    return res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
      });
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout };
