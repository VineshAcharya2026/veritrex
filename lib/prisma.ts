import { db } from "@/lib/db/orm";

/** Prisma-compatible D1 client (loosely typed for route compatibility). */
export const prisma = db as any;
