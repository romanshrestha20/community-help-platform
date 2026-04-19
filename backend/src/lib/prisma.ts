import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const isProduction = process.env.NODE_ENV === "production";

const rawDatabaseUrl = isProduction
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error(
    `DATABASE_URL is not set for ${isProduction ? "production" : "development"}`
  );
}

let parsedUrl: URL;
try {
  parsedUrl = new URL(rawDatabaseUrl);
} catch {
  throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
}

// Optional safety check (only for dev)
if (!isProduction && parsedUrl.hostname === "base") {
  throw new Error(
    "DATABASE_URL host is 'base'. Use localhost when running outside Docker."
  );
}

const adapter = new PrismaPg({ connectionString: rawDatabaseUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };