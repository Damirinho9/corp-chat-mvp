"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const rbac_service_1 = require("../common/rbac/rbac.service");
const sse_gateway_1 = require("../common/sse.gateway");
let ChatsService = class ChatsService {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
    }
    async listForUser(userId) {
        return this.prisma.chat.findMany({
            where: { members: { some: { userId } } },
            include: { members: { include: { user: true } } },
            orderBy: { id: "asc" },
        });
    }
    async getOrCreateDm(senderId, recipientId) {
        const [sender, recipient] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: senderId } }),
            this.prisma.user.findUnique({ where: { id: recipientId } }),
        ]);
        if (!sender || !recipient)
            throw new common_1.ForbiddenException("unknown_user");
        const decision = this.rbac.checkDmPermission(sender, recipient);
        await this.prisma.auditLog.create({
            data: {
                actorId: senderId,
                action: "SEND_DM_ATTEMPT",
                targetId: recipientId,
                resource: "DM",
                outcome: decision.allow ? "ALLOW" : "DENY",
                reason: decision.reason || null,
            },
        });
        if (!decision.allow)
            throw new common_1.ForbiddenException(decision.reason || "dm_forbidden");
        const [u1, u2] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];
        const key = `dm:${u1}-${u2}`;
        const chat = await this.prisma.chat.upsert({
            where: { systemKey: key },
            update: {},
            create: {
                type: "DM",
                name: `ЛС ${u1}-${u2}`,
                systemKey: key,
            },
        });
        await this.prisma.chatMember.upsert({
            where: { chatId_userId: { chatId: chat.id, userId: u1 } },
            update: {},
            create: { chatId: chat.id, userId: u1 },
        });
        await this.prisma.chatMember.upsert({
            where: { chatId_userId: { chatId: chat.id, userId: u2 } },
            update: {},
            create: { chatId: chat.id, userId: u2 },
        });
        (0, sse_gateway_1.pushTo)(senderId, { type: "chat_created", chatId: chat.id });
        (0, sse_gateway_1.pushTo)(recipientId, { type: "chat_created", chatId: chat.id });
        return this.prisma.chat.findUnique({
            where: { id: chat.id },
            include: { members: { include: { user: true } } },
        });
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, rbac_service_1.RbacService])
], ChatsService);
