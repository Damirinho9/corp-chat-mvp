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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    async login(body, res) {
        const user = await this.auth.validateUser(body.username, body.password);
        const { access, refresh } = this.auth.issueTokens({ id: user.id, role: user.role });
        res.cookie("access", access, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });
        res.cookie("refresh", refresh, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { id: user.id, username: user.username, displayName: user.displayName, role: user.role, departmentId: user.departmentId, managerId: user.managerId };
    }
    async refresh(_, res) {
        const refresh = res.req.cookies["refresh"];
        const payload = jsonwebtoken_1.default.verify(refresh, process.env.JWT_REFRESH_SECRET);
        const access = jsonwebtoken_1.default.sign({ sub: payload.sub }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
        res.cookie("access", access, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });
        return { ok: true };
    }
    async logout(res) {
        res.clearCookie("access");
        res.clearCookie("refresh");
        return { ok: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)("logout"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("api/auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
