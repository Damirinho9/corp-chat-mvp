"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const prisma_service_1 = require("../common/prisma.service");
let AdminController = class AdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertAdmin(req) {
        const me = await this.prisma.user.findUnique({ where: { id: req.userId } });
        if (me?.role !== "ADMIN")
            throw new common_1.ForbiddenException("admin_only");
    }
    async ensureMember(chatId, userId) {
        if (!chatId)
            return;
        const exists = await this.prisma.chatMember.findFirst({ where: { chatId, userId } });
        if (!exists)
            await this.prisma.chatMember.create({ data: { chatId, userId } });
    }
    async syncUserSystemGroups(user) {
        const leadership = await this.prisma.chat.findUnique({ where: { systemKey: 'leadership' } });
        const leadership_heads = await this.prisma.chat.findUnique({ where: { systemKey: 'leadership_heads' } });
        const deptKey = user.departmentId ? `dept_${user.departmentId}` : null;
        const dept = deptKey ? await this.prisma.chat.findUnique({ where: { systemKey: deptKey } }) : null;
        if (user.role === 'ADMIN') {
            await this.ensureMember(leadership?.id ?? null, user.id);
            await this.ensureMember(leadership_heads?.id ?? null, user.id);
        }
        else if (user.role === 'HEAD') {
            await this.ensureMember(leadership_heads?.id ?? null, user.id);
        }
        if (dept)
            await this.ensureMember(dept.id, user.id);
    }
    async dms(req, a, b) {
        await this.assertAdmin(req);
        const aId = +a, bId = +b;
        const chat = await this.prisma.chat.findFirst({
            where: { type: "DM", AND: [{ members: { some: { userId: aId } } }, { members: { some: { userId: bId } } }] },
            include: { members: true }
        });
        if (!chat)
            return [];
        return this.prisma.message.findMany({ where: { chatId: chat.id }, orderBy: { createdAt: "asc" } });
    }
    async audit(req) {
        await this.assertAdmin(req);
        return this.prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    }
    async createUser(req, body) {
        await this.assertAdmin(req);
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcrypt")));
        const hash = await bcrypt.hash(body.password, Number(process.env.PASSWORD_SALT_ROUNDS || 10));
        const user = await this.prisma.user.create({ data: { username: body.username, displayName: body.displayName, role: body.role, departmentId: body.departmentId || null, managerId: body.managerId || null, passwordHash: hash } });
        await this.syncUserSystemGroups(user);
        return user;
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("dms"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("a")),
    __param(2, (0, common_1.Query)("b")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "dms", null);
__decorate([
    (0, common_1.Get)("audit"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "audit", null);
__decorate([
    (0, common_1.Post)("users"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("api/admin"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
