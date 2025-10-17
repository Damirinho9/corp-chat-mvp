
import { RbacService } from "../../src/common/rbac/rbac.service";

const user = (id:number, role:string, dept?:number, mgr?:number)=>({ id, role, departmentId: dept ?? null, managerId: mgr ?? null });
const chat = (type:string, dept?:number, key?:string)=>({ type, departmentId: dept ?? null, systemKey: key ?? null });

describe('RBAC Groups', ()=>{
  const r = new RbacService();
  it('admin in leadership', ()=>{
    expect(r.checkGroupPermission(user(1,'ADMIN'), chat('GROUP', null, 'leadership'))).toBe(true);
  });
  it('head not in leadership', ()=>{
    expect(r.checkGroupPermission(user(2,'HEAD'), chat('GROUP', null, 'leadership'))).toBe(false);
  });
  it('head in leadership_heads', ()=>{
    expect(r.checkGroupPermission(user(2,'HEAD'), chat('GROUP', null, 'leadership_heads'))).toBe(true);
  });
  it('employee in own dept group', ()=>{
    expect(r.checkGroupPermission(user(3,'EMPLOYEE', 1), chat('GROUP',1))).toBe(true);
  });
  it('employee not in foreign dept group', ()=>{
    expect(r.checkGroupPermission(user(3,'EMPLOYEE', 1), chat('GROUP',2))).toBe(false);
  });
});
