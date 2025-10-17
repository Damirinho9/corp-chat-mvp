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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const auth_guard_1 = require("../common/auth.guard");
const rbac_service_1 = require("../common/rbac/rbac.service");
let UsersController = class UsersController {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
    }
    async me(req) {
        return this.prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, displayName: true, role: true, departmentId: true } });
    }
    // поиск только по разрешенным адресатам для ЛС
    async search(req, q) {
        const me = await this.prisma.user.findUnique({ where: { id: req.userId } });
        const users = await this.prisma.user.findMany({ where: { username: { contains: q || "" } } });
        return users.filter((u) => this.rbac.checkDmPermission(me, u).allow).map((u) => ({ id: u.id, username: u.username, displayName: u.displayName, role: u.role, departmentId: u.departmentId }));
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "me", null);
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("q")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "search", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("api/users"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, rbac_service_1.RbacService])
], UsersController);
