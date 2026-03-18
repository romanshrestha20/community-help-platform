const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { profile: true },
    });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }
    const { passwordHash, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, address, bio, skills, interests, certifications, profilePicture, latitude, longitude } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(address !== undefined && { address }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(interests !== undefined && { interests }),
        ...(certifications !== undefined && { certifications }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });

    return res.status(200).json({ profile: updatedProfile });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { profile: true },
    });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }
    return res.status(200).json({
      user: {
        id: user.id,
        role: user.role,
        createdAt: user.createdAt,
        profile: user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: { message: errors.array()[0].msg, status: 422 } });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { message: 'Current password is incorrect', status: 401 } });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash },
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getUserById, changePassword };
