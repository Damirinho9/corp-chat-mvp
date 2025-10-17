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
var PresenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const rxjs_1 = require("rxjs");
let PresenceService = PresenceService_1 = class PresenceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.log = new common_1.Logger(PresenceService_1.name);
        this.inactivityTimers = new Map();
        this.awayAfterMs = Number(process.env.PRESENCE_AWAY_MS || 5 * 60 * 1000);
        this.events$ = new rxjs_1.Subject();
        this.statuses = new Map();
    }
    emit(userId, status) {
        this.events$.next({ type: "presence", userId, status, at: new Date().toISOString() });
    }
    clearTimer(userId) {
        const t = this.inactivityTimers.get(userId);
        if (t)
            clearTimeout(t);
        this.inactivityTimers.delete(userId);
    }
    armAwayTimer(userId) {
        this.clearTimer(userId);
        const t = setTimeout(() => this.markAway(userId), this.awayAfterMs);
        this.inactivityTimers.set(userId, t);
    }
    async safeUpdate(userId, data) {
        try {
            await this.prisma.user.update({ where: { id: userId }, data });
        }
        catch (e) {
            this.log.warn(`Failed to update user ${userId} presence: ${String(e)}`);
        }
    }
    async broadcast(userId, status) {
        this.emit(userId, status);
    }
    async setStatus(userId, status) {
        const prev = this.statuses.get(userId);
        if (prev === status) {
            if (status === "ONLINE") {
                await this.safeUpdate(userId, { lastActiveAt: new Date() });
            }
            return;
        }
        this.statuses.set(userId, status);
        const data = status === "ONLINE"
            ? { status, lastActiveAt: new Date() }
            : { status };
        await this.safeUpdate(userId, data);
        try {
            await this.prisma.auditLog.create({
                data: {
                    actorId: userId,
                    action: "presence",
                    resource: "status",
                    outcome: status,
                    targetId: userId,
                },
            });
        }
        catch (e) {
            this.log.warn(`AuditLog presence insert failed for user ${userId}: ${String(e)}`);
        }
        this.broadcast(userId, status);
    }
    async markOnline(userId) {
        this.clearTimer(userId);
        await this.setStatus(userId, "ONLINE");
        this.armAwayTimer(userId);
    }
    async markAway(userId) {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
        if (!u || u.status === "OFFLINE")
            return;
        await this.setStatus(userId, "AWAY");
    }
    async markOffline(userId) {
        this.clearTimer(userId);
        await this.setStatus(userId, "OFFLINE");
    }
    async ping(userId) {
        await this.setStatus(userId, "ONLINE");
        this.armAwayTimer(userId);
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = PresenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PresenceService);
