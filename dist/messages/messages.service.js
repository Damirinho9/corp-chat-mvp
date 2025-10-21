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
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendToChat(senderId, chatId, content, attachmentIds = []) {
        const me = await this.prisma.user.findUnique({ where: { id: senderId } });
        const member = await this.prisma.chatMember.findFirst({
            where: { chatId, userId: senderId },
        });
        if (me?.role !== "ADMIN" && !member) {
            throw new common_1.ForbiddenException("not_a_member");
        }
        if (!content && (!attachmentIds || attachmentIds.length === 0)) {
            throw new common_1.ForbiddenException("empty_message");
        }
        const msg = await this.prisma.message.create({
            data: {
                chatId,
                senderId,
                content: content || "",
            },
            include: {
                sender: {
                    select: { id: true, username: true, displayName: true },
                },
                attachments: true,
            },
        });
        if (attachmentIds?.length) {
            await this.prisma.attachment.updateMany({
                where: {
                    id: { in: attachmentIds },
                    uploadedById: senderId,
                    messageId: null,
                },
                data: { messageId: msg.id },
            });
        }
        return {
            id: msg.id,
            chatId: msg.chatId,
            senderId: msg.senderId,
            content: msg.content,
            createdAt: msg.createdAt,
            sender: msg.sender,
            attachments: msg.attachments ?? [],
            type: "message",
        };
    }
    async sendDm(senderId, recipientId, content, attachmentIds = []) {
        const dmChatId = await this.getOrCreateDmChatId(senderId, recipientId);
        return this.sendToChat(senderId, dmChatId, content, attachmentIds);
    }
    async list(chatId, requesterId, opts) {
        const member = await this.prisma.chatMember.findFirst({
            where: { chatId, userId: requesterId },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true },
        });
        if (!member && user?.role !== "ADMIN") {
            throw new common_1.ForbiddenException("not_a_member");
        }
        return this.prisma.message.findMany({
            where: {
                chatId,
                ...(opts?.before && { createdAt: { lt: new Date(opts.before) } }),
                ...(opts?.after && { createdAt: { gt: new Date(opts.after) } }),
            },
            orderBy: { createdAt: "asc" },
            take: Math.min(opts?.limit || 50, 200),
            include: {
                sender: {
                    select: { id: true, username: true, displayName: true },
                },
                attachments: true,
            },
        });
    }
    async getOrCreateDmChatId(a, b) {
        const [userA, userB] = a < b ? [a, b] : [b, a];
        const dmName = `dm:${userA}-${userB}`;
        const existing = await this.prisma.chat.findFirst({
            where: { name: dmName, type: "DM" },
            select: { id: true },
        });
        if (existing)
            return existing.id;
        const chat = await this.prisma.chat.create({
            data: {
                name: dmName,
                type: "DM",
                members: {
                    create: [{ userId: userA }, { userId: userB }],
                },
            },
            select: { id: true },
        });
        return chat.id;
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
