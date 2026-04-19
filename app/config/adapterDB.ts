import 'dotenv/config'
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Use DIRECT_URL (port 5432) to bypass pgbouncer for now
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('🔗 Connecting to:', connectionString?.replace(/:([^@]+)@/, ':****@')); // hide password in log

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });