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
const auth_guard_1 = require("../common/auth.guard");
const rate_limit_guard_1 = require("../common/rate-limit.guard");
const chats_service_1 = require("./chats.service");
const messages_service_1 = require("../messages/messages.service");
let ChatsController = class ChatsController {
    constructor(chats, messages) {
        this.chats = chats;
        this.messages = messages;
    }
    list(req) { return this.chats.listForUser(req.userId); }
    async createDm(req, body) { return this.chats.getOrCreateDm(req.userId, body.recipientId); }
    listMessages(req, id) { return this.messages.list(+id, req.userId); }
    sendDm(req, body) { return this.messages.sendDm(req.userId, body.recipientId, body.content); }
    sendToChat(req, body) { return this.messages.sendToChat(req.userId, body.chatId, body.content); }
};
exports.ChatsController = ChatsController;
__decorate([
    (0, common_1.Get)("chats"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("chats/dm"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "createDm", null);
__decorate([
    (0, common_1.Get)("chats/:id/messages"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatsController.prototype, "listMessages", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)("messages/dm"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatsController.prototype, "sendDm", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)("messages/chat"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatsController.prototype, "sendToChat", null);
exports.ChatsController = ChatsController = __decorate([
    (0, common_1.Controller)("api"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [chats_service_1.ChatsService, messages_service_1.MessagesService])
], ChatsController);
