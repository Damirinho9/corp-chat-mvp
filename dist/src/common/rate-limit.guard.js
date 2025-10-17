"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const buckets = new Map();
const LIMIT = Number(process.env.RATE_LIMIT_COUNT || 10);
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10000);
let RateLimitGuard = class RateLimitGuard {
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const userId = req.userId;
        const now = Date.now();
        let b = buckets.get(userId);
        if (!b) {
            b = { ts: [] };
            buckets.set(userId, b);
        }
        b.ts = b.ts.filter(t => now - t < WINDOW_MS);
        if (b.ts.length >= LIMIT)
            throw new common_1.ForbiddenException("rate_limited");
        b.ts.push(now);
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], RateLimitGuard);
