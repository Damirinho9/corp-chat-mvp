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
        const exists = await this.prisma.chatMember.findFirst({
            where: { chatId, userId },
        });
        if (!exists)
            await this.prisma.chatMember.create({ data: { chatId, userId } });
    }
    async getOrCreateDeptChatId(deptId) {
        if (!deptId)
            return null;
        const key = `dept_${deptId}`;
        let chat = await this.prisma.chat.findUnique({ where: { systemKey: key } });
        if (!chat) {
            const dept = await this.prisma.department.findUnique({
                where: { id: deptId },
            });
            chat = await this.prisma.chat.create({
                data: {
                    type: "GROUP",
                    name: `Отдел ${dept?.name || deptId}`,
                    departmentId: deptId,
                    systemKey: key,
                },
            });
        }
        return chat.id;
    }
    async syncUserSystemGroupsFull(user, before) {
        const leadership = await this.prisma.chat.findUnique({
            where: { systemKey: "leadership" },
        });
        const leadership_heads = await this.prisma.chat.findUnique({
            where: { systemKey: "leadership_heads" },
        });
        const newDeptChatId = await this.getOrCreateDeptChatId(user.departmentId ?? null);
        const oldDeptChatId = await this.getOrCreateDeptChatId(before?.departmentId ?? null);
        const should = new Set();
        if (user.role === "ADMIN") {
            if (leadership?.id)
                should.add(leadership.id);
            if (leadership_heads?.id)
                should.add(leadership_heads.id);
        }
        else if (user.role === "HEAD") {
            if (leadership_heads?.id)
                should.add(leadership_heads.id);
        }
        if (newDeptChatId)
            should.add(newDeptChatId);
        const systemChatIds = [
            leadership?.id,
            leadership_heads?.id,
            newDeptChatId,
            oldDeptChatId,
        ].filter(Boolean);
        if (systemChatIds.length === 0)
            return;
        const current = await this.prisma.chatMember.findMany({
            where: { userId: user.id, chatId: { in: systemChatIds } },
            select: { chatId: true },
        });
        const currentSet = new Set(current.map((m) => m.chatId));
        const toAdd = Array.from(should).filter((id) => !currentSet.has(id));
        const toRemove = Array.from(currentSet).filter((id) => !should.has(id));
        await this.prisma.$transaction(async (tx) => {
            for (const id of toAdd) {
                await tx.chatMember.create({ data: { chatId: id, userId: user.id } });
            }
            for (const id of toRemove) {
                await tx.chatMember.deleteMany({
                    where: { chatId: id, userId: user.id },
                });
            }
        });
    }
    async updateUser(req, idParam, body) {
        await this.assertAdmin(req);
        const id = Number(idParam);
        if (Number.isNaN(id))
            throw new common_1.ForbiddenException("bad_id");
        if (Object.prototype.hasOwnProperty.call(body, "managerId") &&
            body.managerId === id) {
            throw new common_1.ForbiddenException("manager_cannot_be_self");
        }
        const before = await this.prisma.user.findUnique({
            where: { id },
            select: { role: true, departmentId: true },
        });
        if (!before)
            throw new common_1.ForbiddenException("user_not_found");
        const data = {};
        if (typeof body.displayName === "string")
            data.displayName = body.displayName;
        if (typeof body.role === "string")
            data.role = body.role;
        if (Object.prototype.hasOwnProperty.call(body, "departmentId")) {
            data.department =
                body.departmentId == null
                    ? { disconnect: true }
                    : { connect: { id: Number(body.departmentId) } };
        }
        if (Object.prototype.hasOwnProperty.call(body, "managerId")) {
            if (body.managerId != null) {
                const mgrId = Number(body.managerId);
                if (Number.isNaN(mgrId))
                    throw new common_1.ForbiddenException("bad_managerId");
                const mgr = await this.prisma.user.findUnique({
                    where: { id: mgrId },
                    select: { id: true },
                });
                if (!mgr)
                    throw new common_1.ForbiddenException("manager_not_found");
                data.managerId = mgrId;
            }
            else {
                data.managerId = null;
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, role: true, departmentId: true },
        });
        await this.syncUserSystemGroupsFull({
            id: updated.id,
            role: updated.role,
            departmentId: updated.departmentId ?? null,
        }, { role: before.role, departmentId: before.departmentId ?? null });
        return updated;
    }
    async syncUserSystemGroups(user) {
        const leadership = await this.prisma.chat.findUnique({
            where: { systemKey: "leadership" },
        });
        const leadership_heads = await this.prisma.chat.findUnique({
            where: { systemKey: "leadership_heads" },
        });
        const deptKey = user.departmentId ? `dept_${user.departmentId}` : null;
        const dept = deptKey
            ? await this.prisma.chat.findUnique({ where: { systemKey: deptKey } })
            : null;
        if (user.role === "ADMIN") {
            await this.ensureMember(leadership?.id ?? null, user.id);
            await this.ensureMember(leadership_heads?.id ?? null, user.id);
        }
        else if (user.role === "HEAD") {
            await this.ensureMember(leadership_heads?.id ?? null, user.id);
        }
        if (dept)
            await this.ensureMember(dept.id, user.id);
    }
    async dms(req, a, b) {
        await this.assertAdmin(req);
        const aId = +a, bId = +b;
        const chat = await this.prisma.chat.findFirst({
            where: {
                type: "DM",
                AND: [
                    { members: { some: { userId: aId } } },
                    { members: { some: { userId: bId } } },
                ],
            },
            include: { members: true },
        });
        if (!chat)
            return [];
        return this.prisma.message.findMany({
            where: { chatId: chat.id },
            orderBy: { createdAt: "asc" },
        });
    }
    async audit(req) {
        await this.assertAdmin(req);
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }
    async createUser(req, body) {
        await this.assertAdmin(req);
        const pwd = body.password || "";
        const tooShort = pwd.length < 8;
        const sameAsUser = pwd.toLowerCase() === (body.username || "").toLowerCase();
        const weak = !(/[a-zA-Z]/.test(pwd) && /\d/.test(pwd));
        if (tooShort || sameAsUser || weak) {
            throw new common_1.ForbiddenException("passwordTooWeak");
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcrypt")));
        const hash = await bcrypt.hash(body.password, Number(process.env.PASSWORD_SALT_ROUNDS || 10));
        const data = {
            username: body.username,
            displayName: body.displayName,
            role: body.role,
            passwordHash: hash,
        };
        if (body.departmentId != null) {
            data.department = { connect: { id: Number(body.departmentId) } };
        }
        if (body.managerId != null) {
            data.managerId = Number(body.managerId);
        }
        const user = await this.prisma.user.create({ data });
        await this.syncUserSystemGroups(user);
        return user;
    }
    async listUsers(req) {
        await this.assertAdmin(req);
        return this.prisma.user.findMany({
            orderBy: { id: "asc" },
            select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
                departmentId: true,
            },
        });
    }
    async yourMethod(body) {
        const pwd = body.password || "";
        const sameAsUser = pwd.toLowerCase() === (body.username || "").toLowerCase();
        return { sameAsUser };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)("users/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
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
__decorate([
    (0, common_1.Get)("users"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)("check-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "yourMethod", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("api/admin"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
