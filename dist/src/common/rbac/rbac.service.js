"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
let RbacService = class RbacService {
    checkDmPermission(sender, recipient) {
        if (sender.role === 'ADMIN')
            return { allow: true };
        if (sender.role === 'HEAD') {
            if (recipient.role === 'ADMIN')
                return { allow: true };
            if (recipient.role === 'HEAD')
                return { allow: true };
            if (recipient.role === 'EMPLOYEE' && recipient.departmentId === sender.departmentId)
                return { allow: true };
            return { allow: false, reason: "head_to_foreign_employee_forbidden" };
        }
        if (recipient.role === 'ADMIN')
            return { allow: true };
        if (recipient.role === 'HEAD' &&
            recipient.departmentId === sender.departmentId &&
            sender.managerId === recipient.id)
            return { allow: true };
        return { allow: false, reason: "employee_dm_forbidden" };
    }
    checkGroupPermission(user, chat) {
        if (chat.type === "GROUP") {
            if (chat.systemKey === "leadership")
                return user.role === 'ADMIN';
            if (chat.systemKey === "leadership_heads")
                return user.role === 'ADMIN' || user.role === 'HEAD';
            if (chat.departmentId)
                return user.departmentId === chat.departmentId;
        }
        return true;
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)()
], RbacService);
