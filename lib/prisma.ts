import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL (and optional DATABASE_POOL_URL) must be set to initialize Prisma.")
}

type GlobalPrisma = {
  prisma?: PrismaClient
  pool?: Pool
}

const globalForPrisma = globalThis as unknown as GlobalPrisma

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  })

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}
