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

  /** Создаёт или возвращает существующий DM-чат для пары пользователей */
  async getOrCreateDm(senderId: number, recipientId: number) {
    const [sender, recipient] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
    ]);
    if (!sender || !recipient) throw new ForbiddenException("unknown_user");

    const decision = this.rbac.checkDmPermission(sender, recipient);
    await this.prisma.auditLog.create({
      data: {
        actorId: senderId,
        action: "SEND_DM_ATTEMPT",
        targetId: recipientId,
        resource: "DM",
        outcome: decision.allow ? "ALLOW" : "DENY",
        reason: decision.reason || null,
      },
    });
    if (!decision.allow)
      throw new ForbiddenException(decision.reason || "dm_forbidden");

    // 🔹 гарантированный уникальный ключ для пары
    const [u1, u2] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];
    const key = `dm:${u1}-${u2}`;

    // 🔹 upsert чата по systemKey
    const chat = await this.prisma.chat.upsert({
      where: { systemKey: key },
      update: {},
      create: {
        type: "DM",
        name: `ЛС ${u1}-${u2}`,
        systemKey: key,
      },
    });

    // 🔹 гарантируем членство обоих пользователей
    await this.prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId: u1 } },
      update: {},
      create: { chatId: chat.id, userId: u1 },
    });
    await this.prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId: u2 } },
      update: {},
      create: { chatId: chat.id, userId: u2 },
    });

    // 🔹 уведомляем участников о новом чате
    pushTo(senderId, { type: "chat_created", chatId: chat.id });
    pushTo(recipientId, { type: "chat_created", chatId: chat.id });

    return this.prisma.chat.findUnique({
      where: { id: chat.id },
      include: { members: { include: { user: true } } },
    });
  }
}