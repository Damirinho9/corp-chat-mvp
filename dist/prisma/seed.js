"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const seed_lib_1 = require("./seed-lib");
const prisma = new client_1.PrismaClient();
(0, seed_lib_1.seedAll)(prisma).finally(() => prisma.$disconnect());
