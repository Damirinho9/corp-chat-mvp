import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { RbacService } from "../common/rbac/rbac.service";
import { pushTo } from "../common/sse.gateway";

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService, private rbac: RbacService) {}

  async listForUser(userId: number) {
    return this.prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { id: "asc" },
    });
  }

  async getOrCreateDm(senderId: number, recipientId: number) {
    const [sender, recipient] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
    ]);
    if (!sender || !recipient) throw new ForbiddenException("unknown_user");

    const decision = this.rbac.checkDmPermission(sender, recipient);
    await this.prisma.auditLog.create({
      data: { actorId: senderId, action: "SEND_DM_ATTEMPT", targetId: recipientId, resource: "DM", outcome: decision.allow ? "ALLOW" : "DENY", reason: decision.reason || null }
    });
    if (!decision.allow) throw new ForbiddenException(decision.reason || "dm_forbidden");

    const existing = await this.prisma.chat.findFirst({
      where: { type: 'DM', AND: [ { members: { some: { userId: senderId } } }, { members: { some: { userId: recipientId } } } ] },
      include: { members: true },
    });
    if (existing) return existing;
    const created = await this.prisma.chat.create({
      data: {
        type: 'DM',
        name: `dm_${senderId}_${recipientId}`,
        members: { create: [{ userId: senderId }, { userId: recipientId }] },
      },
      include: { members: true },
    });
    // уведомить участников о новом DM чате
    pushTo(senderId, { type: "chat_created", chatId: created.id });
    pushTo(recipientId, { type: "chat_created", chatId: created.id });
    return created;
  }
}
