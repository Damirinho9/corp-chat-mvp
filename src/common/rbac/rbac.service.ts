import { Injectable } from "@nestjs/common";

export type RBUser = { id: number; role: string; departmentId: number | null; managerId: number | null };

export type DmDecision = { allow: boolean; reason?: string };

@Injectable()
export class RbacService {
  checkDmPermission(sender: RBUser, recipient: RBUser): DmDecision {
    if (sender.role === 'ADMIN') return { allow: true };

    if (sender.role === 'HEAD') {
      if (recipient.role === 'ADMIN') return { allow: true };
      if (recipient.role === 'HEAD') return { allow: true };
      if (recipient.role === 'EMPLOYEE' && recipient.departmentId === sender.departmentId)
        return { allow: true };
      return { allow: false, reason: "head_to_foreign_employee_forbidden" };
    }

    if (recipient.role === 'ADMIN') return { allow: true };
    if (
      recipient.role === 'HEAD' &&
      recipient.departmentId === sender.departmentId &&
      sender.managerId === recipient.id
    )
      return { allow: true };

    return { allow: false, reason: "employee_dm_forbidden" };
  }

  checkGroupPermission(user: RBUser, chat: { type: string; departmentId?: number | null; systemKey?: string | null }): boolean {
    if (chat.type === "GROUP") {
      if (chat.systemKey === "leadership") return user.role === 'ADMIN';
      if (chat.systemKey === "leadership_heads") return user.role === 'ADMIN' || user.role === 'HEAD';
      if (chat.departmentId) return user.departmentId === chat.departmentId;
    }
    return true;
  }
}
