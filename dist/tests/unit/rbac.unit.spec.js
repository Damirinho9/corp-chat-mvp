"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_service_1 = require("../../src/common/rbac/rbac.service");
const client_1 = require("@prisma/client");
const u = (id, role, dept, mgr) => ({ id, role, departmentId: dept ?? null, managerId: mgr ?? null });
describe('RBAC DM', () => {
    const r = new rbac_service_1.RbacService();
    it('admin -> everyone', () => { expect(r.checkDmPermission(u(1, client_1.RoleName.ADMIN), u(2, client_1.RoleName.EMPLOYEE)).allow).toBe(true); });
    it('head -> admin', () => { expect(r.checkDmPermission(u(2, client_1.RoleName.HEAD, 1), u(1, client_1.RoleName.ADMIN)).allow).toBe(true); });
    it('head -> head', () => { expect(r.checkDmPermission(u(2, client_1.RoleName.HEAD, 1), u(3, client_1.RoleName.HEAD, 2)).allow).toBe(true); });
    it('head -> employee same dept', () => { expect(r.checkDmPermission(u(2, client_1.RoleName.HEAD, 1), u(4, client_1.RoleName.EMPLOYEE, 1)).allow).toBe(true); });
    it('head -> employee foreign dept - deny', () => { expect(r.checkDmPermission(u(2, client_1.RoleName.HEAD, 1), u(5, client_1.RoleName.EMPLOYEE, 2)).allow).toBe(false); });
    it('employee -> admin', () => { expect(r.checkDmPermission(u(6, client_1.RoleName.EMPLOYEE, 1, 2), u(1, client_1.RoleName.ADMIN)).allow).toBe(true); });
    it('employee -> own head same dept - allow', () => { expect(r.checkDmPermission(u(6, client_1.RoleName.EMPLOYEE, 1, 2), u(2, client_1.RoleName.HEAD, 1)).allow).toBe(true); });
    it('employee -> head other dept - deny', () => { expect(r.checkDmPermission(u(6, client_1.RoleName.EMPLOYEE, 1, 2), u(7, client_1.RoleName.HEAD, 2)).allow).toBe(false); });
    it('employee -> employee - deny', () => { expect(r.checkDmPermission(u(6, client_1.RoleName.EMPLOYEE, 1, 2), u(8, client_1.RoleName.EMPLOYEE, 1, 2)).allow).toBe(false); });
});
