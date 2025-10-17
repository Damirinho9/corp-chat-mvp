"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsModule = void 0;
const common_1 = require("@nestjs/common");
const chats_controller_1 = require("./chats.controller");
const chats_service_1 = require("./chats.service");
const messages_service_1 = require("../messages/messages.service");
const prisma_service_1 = require("../common/prisma.service");
const rbac_service_1 = require("../common/rbac/rbac.service");
let ChatsModule = class ChatsModule {
};
exports.ChatsModule = ChatsModule;
exports.ChatsModule = ChatsModule = __decorate([
    (0, common_1.Module)({
        controllers: [chats_controller_1.ChatsController],
        providers: [chats_service_1.ChatsService, messages_service_1.MessagesService, prisma_service_1.PrismaService, rbac_service_1.RbacService],
    })
], ChatsModule);
