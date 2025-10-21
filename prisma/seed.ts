console.log("🚀 Starting seed to:", process.env.DATABASE_URL);
import { PrismaClient } from "@prisma/client";
import { seedAll } from "./seed-lib";
const prisma = new PrismaClient();
seedAll(prisma).finally(()=>prisma.$disconnect());
