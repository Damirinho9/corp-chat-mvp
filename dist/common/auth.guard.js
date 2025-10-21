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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let AuthGuard = class AuthGuard {
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        let token = null;
        const authHeader = req.headers['authorization'];
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
        if (!token && req.cookies?.access) {
            token = req.cookies.access;
        }
        if (!token && typeof req.query?.access_token === 'string') {
            token = req.query.access_token;
        }
        if (!token)
            throw new common_1.UnauthorizedException("no_token");
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
            req.userId = payload.sub ?? payload.id;
            req.userRole = payload.role;
            return true;
        }
        catch (err) {
            throw new common_1.UnauthorizedException("invalid_token");
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)()
], AuthGuard);
