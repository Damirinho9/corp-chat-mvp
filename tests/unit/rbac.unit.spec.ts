import { RbacService } from "../../src/common/rbac/rbac.service";
const u = (id:number, role:RoleName, dept?:number, mgr?:number)=>({ id, role, departmentId: dept ?? null, managerId: mgr ?? null } as any);

describe('RBAC DM', ()=>{
  const r = new RbacService();
  it('admin -> everyone', ()=>{ expect(r.checkDmPermission(u(1,'ADMIN'), u(2,'EMPLOYEE')).allow).toBe(true); });
  it('head -> admin', ()=>{ expect(r.checkDmPermission(u(2,'HEAD',1), u(1,'ADMIN')).allow).toBe(true); });
  it('head -> head', ()=>{ expect(r.checkDmPermission(u(2,'HEAD',1), u(3,'HEAD',2)).allow).toBe(true); });
  it('head -> employee same dept', ()=>{ expect(r.checkDmPermission(u(2,'HEAD',1), u(4,'EMPLOYEE',1)).allow).toBe(true); });
  it('head -> employee foreign dept - deny', ()=>{ expect(r.checkDmPermission(u(2,'HEAD',1), u(5,'EMPLOYEE',2)).allow).toBe(false); });
  it('employee -> admin', ()=>{ expect(r.checkDmPermission(u(6,'EMPLOYEE',1,2), u(1,'ADMIN')).allow).toBe(true); });
  it('employee -> own head same dept - allow', ()=>{ expect(r.checkDmPermission(u(6,'EMPLOYEE',1,2), u(2,'HEAD',1)).allow).toBe(true); });
  it('employee -> head other dept - deny', ()=>{ expect(r.checkDmPermission(u(6,'EMPLOYEE',1,2), u(7,'HEAD',2)).allow).toBe(false); });
  it('employee -> employee - deny', ()=>{ expect(r.checkDmPermission(u(6,'EMPLOYEE',1,2), u(8,'EMPLOYEE',1,2)).allow).toBe(false); });
});
