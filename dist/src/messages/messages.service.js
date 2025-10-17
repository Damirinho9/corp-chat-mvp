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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const rbac_service_1 = require("../common/rbac/rbac.service");
const sse_gateway_1 = require("../common/sse.gateway");
let MessagesService = class MessagesService {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
    }
    async ensureDm(senderId, recipientId) {
        const [sender, recipient] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: senderId } }),
            this.prisma.user.findUnique({ where: { id: recipientId } }),
        ]);
        if (!sender || !recipient)
            throw new common_1.ForbiddenException("unknown_user");
        const decision = this.rbac.checkDmPermission(sender, recipient);
        await this.prisma.auditLog.create({ data: { actorId: senderId, action: "SEND_DM_ATTEMPT", targetId: recipientId, resource: "DM", outcome: decision.allow ? "ALLOW" : "DENY", reason: decision.reason || null } });
        if (!decision.allow)
            throw new common_1.ForbiddenException(decision.reason || "dm_forbidden");
        // найти существующий DM между этими пользователями
        const chat = await this.prisma.chat.findFirst({
            where: { type: 'DM', AND: [{ members: { some: { userId: senderId } } }, { members: { some: { userId: recipientId } } }] },
            include: { members: true },
        });
        if (chat)
            return chat;
        // создать DM
        return this.prisma.chat.create({
            data: {
                type: 'DM',
                name: `dm_${senderId}_${recipientId}`,
                members: { create: [{ userId: senderId }, { userId: recipientId }] },
            },
            include: { members: true },
        });
    }
    async sendDm(senderId, recipientId, content) {
        if (!content || content.length === 0)
            throw new common_1.ForbiddenException("empty_content");
        if (content.length > 2000)
            throw new common_1.ForbiddenException("content_too_long");
        const chat = await this.ensureDm(senderId, recipientId);
        const msg = await this.prisma.message.create({ data: { chatId: chat.id, senderId, content } });
        // уведомить участников
        const members = await this.prisma.chatMember.findMany({ where: { chatId: chat.id } });
        for (const m of members)
            (0, sse_gateway_1.pushTo)(m.userId, { type: "message", chatId: chat.id, senderId, messageId: msg.id, content });
        return msg;
    }
    async sendToChat(userId, chatId, content) {
        if (!content || content.length === 0)
            throw new common_1.ForbiddenException("empty_content");
        if (content.length > 2000)
            throw new common_1.ForbiddenException("content_too_long");
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!chat || !user)
            throw new common_1.ForbiddenException("not_found");
        const isMember = await this.prisma.chatMember.findFirst({ where: { chatId, userId } });
        if (!isMember)
            throw new common_1.ForbiddenException("not_a_member");
        if (!this.rbac.checkGroupPermission(user, chat))
            throw new common_1.ForbiddenException("group_forbidden");
        const msg = await this.prisma.message.create({ data: { chatId, senderId: userId, content } });
        const members = await this.prisma.chatMember.findMany({ where: { chatId } });
        for (const m of members)
            (0, sse_gateway_1.pushTo)(m.userId, { type: "message", chatId, senderId: userId, messageId: msg.id, content });
        return msg;
    }
    async list(chatId, userId) {
        const isMember = await this.prisma.chatMember.findFirst({ where: { chatId, userId } });
        if (!isMember)
            throw new common_1.ForbiddenException("not_a_member");
        return this.prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: "asc" } });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, rbac_service_1.RbacService])
], MessagesService);
