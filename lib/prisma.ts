import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { isCloudflareWorker } from "@/lib/platform";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createWorkerPrisma(env: CloudflareEnv): PrismaClient {
  const connectionString =
    env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "Database not configured. Bind HYPERDRIVE in wrangler.toml or set DATABASE_URL."
    );
  }

  const pool = new Pool({ connectionString, max: 1 });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ["error"],
  });
}

function createNodePrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({ connectionString: databaseUrl });
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg(globalForPrisma.pgPool),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

function getPrismaClient(): PrismaClient {
  if (isCloudflareWorker()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as { env: CloudflareEnv };

    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createWorkerPrisma(env);
    }
    return globalForPrisma.prisma;
  }

  return createNodePrisma();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
