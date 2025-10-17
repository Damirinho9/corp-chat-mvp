"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const logging_1 = require("./logging");
let PrismaService = class PrismaService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async onModuleInit() {
        await this.prisma.$connect();
        // ✅ корректно работает в Prisma 6.17.1
        this.prisma.$use(async (params, next) => {
            const result = await next(params);
            try {
                if (params.model === "AuditLog" && params.action === "create") {
                    const data = params.args?.data || {};
                    logging_1.auditLogger.info({
                        time: new Date().toISOString(),
                        actorId: data.actorId ?? null,
                        action: data.action ?? null,
                        targetId: data.targetId ?? null,
                        resource: data.resource ?? null,
                        outcome: data.outcome ?? null,
                        reason: data.reason ?? null,
                    });
                }
            }
            catch {
                // не ломаем бизнес-логику при сбое логирования
            }
            return result;
        });
    }
    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }
    // Проксирование моделей
    get user() { return this.prisma.user; }
    get department() { return this.prisma.department; }
    get chat() { return this.prisma.chat; }
    get chatMember() { return this.prisma.chatMember; }
    get message() { return this.prisma.message; }
    get attachment() { return this.prisma.attachment; }
    get auditLog() { return this.prisma.auditLog; }
    // Универсальный $transaction
    $transaction(input) {
        return this.prisma.$transaction(input);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
