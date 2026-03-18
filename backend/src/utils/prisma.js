const { PrismaClient } = require('@prisma/client');

// Singleton pattern: reuse the same instance across hot-reloads and avoid
// exhausting database connections in development and serverless environments.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
