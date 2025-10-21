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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsController = void 0;
const common_1 = require("@nestjs/common");
const chats_service_1 = require("./chats.service");
const messages_service_1 = require("../messages/messages.service");
const prisma_service_1 = require("../common/prisma.service");
const auth_guard_1 = require("../common/auth.guard");
let ChatsController = class ChatsController {
    constructor(chats, messages, prisma) {
        this.chats = chats;
        this.messages = messages;
        this.prisma = prisma;
    }
    async list(req) {
        return this.chats.listForUser(req.userId);
    }
    async getMessages(req, id, limit = 50) {
        const chatId = Number(id);
        const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
        const member = await this.prisma.chatMember.findFirst({
            where: { chatId, userId: req.userId },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });
        if (!member && user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('forbidden');
        }
        const rows = await this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            take,
            include: {
                sender: { select: { id: true, username: true, displayName: true } },
            },
        });
        return rows.map((m) => ({
            id: m.id,
            chatId: m.chatId,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt,
            sender: m.sender,
        }));
    }
    async getOrCreateDm(req, body) {
        const userId = Number(req.userId);
        const recipientId = Number(body.recipientId);
        if (!recipientId || recipientId === userId) {
            throw new common_1.ForbiddenException('invalid_recipient');
        }
        return this.chats.getOrCreateDm(userId, recipientId);
    }
    async sendToChat(req, body) {
        return this.messages.sendToChat(req.userId, body.chatId, body.content || '', body.attachmentIds || []);
    }
    async sendDm(req, body) {
        return this.messages.sendDm(req.userId, body.recipientId, body.content || '', body.attachmentIds || []);
    }
};
exports.ChatsController = ChatsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('dm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getOrCreateDm", null);
__decorate([
    (0, common_1.Post)('messages/chat'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "sendToChat", null);
__decorate([
    (0, common_1.Post)('messages/dm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "sendDm", null);
exports.ChatsController = ChatsController = __decorate([
    (0, common_1.Controller)('api/chats'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [chats_service_1.ChatsService,
        messages_service_1.MessagesService,
        prisma_service_1.PrismaService])
], ChatsController);
