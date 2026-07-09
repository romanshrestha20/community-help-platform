import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

let counter = 0;

export const uniqueValue = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
};

export const createUser = async (
  overrides: Partial<Prisma.UserModelCreateInput> = {}
) => {
  const email = overrides.email ?? `${uniqueValue("user")}@example.com`;
  const phone = overrides.phone ?? `+1555${String(counter).padStart(7, "0")}`;

  return prisma.userModel.create({
    data: {
      email,
      phone,
      isVerified: true,
      isEmailVerified: true,
      ...overrides,
    },
  });
};
