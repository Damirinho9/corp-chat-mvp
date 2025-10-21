"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const departments_module_1 = require("./departments/departments.module");
const chats_module_1 = require("./chats/chats.module");
const messages_module_1 = require("./messages/messages.module");
const admin_module_1 = require("./admin/admin.module");
const uploads_module_1 = require("./uploads/uploads.module");
const presence_module_1 = require("./presence/presence.module");
const prisma_service_1 = require("./common/prisma.service");
const rbac_service_1 = require("./common/rbac/rbac.service");
const ui_controller_1 = require("./ui/ui.controller");
const sse_gateway_1 = require("./common/sse.gateway");
const jwt_middleware_1 = require("./auth/jwt.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply((0, cookie_parser_1.default)(), jwt_middleware_1.JwtMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            chats_module_1.ChatsModule,
            messages_module_1.MessagesModule,
            admin_module_1.AdminModule,
            uploads_module_1.UploadsModule,
            presence_module_1.PresenceModule,
        ],
        controllers: [ui_controller_1.UiController, sse_gateway_1.SseGateway],
        providers: [prisma_service_1.PrismaService, rbac_service_1.RbacService],
    })
], AppModule);
