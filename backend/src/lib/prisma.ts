import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

if (!rawDatabaseUrl) {
    throw new Error(
        "DATABASE_URL is not set. Add it to backend/.env and restart the server."
    );
}

let parsedUrl: URL;
try {
    parsedUrl = new URL(rawDatabaseUrl);
} catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
}

if (parsedUrl.hostname === "base") {
    throw new Error(
        "DATABASE_URL host is 'base', which is typically a Docker service name. If running the backend on your host machine, use localhost (or 127.0.0.1) as the database host."
    );
}

const connectionString = rawDatabaseUrl;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };