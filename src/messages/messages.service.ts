import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // === Отправка сообщения в чат ===
  async sendToChat(
    senderId: number,
    chatId: number,
    content: string,
    attachmentIds: number[] = [],
  ) {
    // Проверка: участник или админ
    const me = await this.prisma.user.findUnique({ where: { id: senderId } });
    const member = await this.prisma.chatMember.findFirst({
      where: { chatId, userId: senderId },
    });

    if (me?.role !== "ADMIN" && !member) {
      throw new ForbiddenException("not_a_member");
    }

    // Пустое сообщение запрещено
    if (!content && (!attachmentIds || attachmentIds.length === 0)) {
      throw new ForbiddenException("empty_message");
    }

    // Создаём сообщение
    const msg = await this.prisma.message.create({
      data: {
        chatId,
        senderId,
        content: content || "",
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        attachments: true,
      },
    });

    // Если есть вложения — привязываем к сообщению
    if (attachmentIds?.length) {
      await this.prisma.attachment.updateMany({
        where: {
          id: { in: attachmentIds },
          uploadedById: senderId,
          messageId: null,
        },
        data: { messageId: msg.id },
      });
    }

    // Возвращаем полное сообщение для мгновенного отображения на фронте
    return {
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: msg.sender,
      attachments: msg.attachments ?? [],
      type: "message",
    };
  }

  // === Отправка личного сообщения ===
  async sendDm(
    senderId: number,
    recipientId: number,
    content: string,
    attachmentIds: number[] = [],
  ) {
    const dmChatId = await this.getOrCreateDmChatId(senderId, recipientId);
    return this.sendToChat(senderId, dmChatId, content, attachmentIds);
  }

  // === Список сообщений в чате ===
  async list(
    chatId: number,
    requesterId: number,
    opts?: { before?: string; after?: string; limit?: number },
  ) {
    // Можно вставить проверку доступа по членству
    const member = await this.prisma.chatMember.findFirst({
      where: { chatId, userId: requesterId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    if (!member && user?.role !== "ADMIN") {
      throw new ForbiddenException("not_a_member");
    }

    return this.prisma.message.findMany({
      where: {
        chatId,
        ...(opts?.before && { createdAt: { lt: new Date(opts.before) } }),
        ...(opts?.after && { createdAt: { gt: new Date(opts.after) } }),
      },
      orderBy: { createdAt: "asc" },
      take: Math.min(opts?.limit || 50, 200),
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        attachments: true,
      },
    });
  }

  // === Вспомогательное: создать/найти DM ===
  private async getOrCreateDmChatId(a: number, b: number): Promise<number> {
    const [userA, userB] = a < b ? [a, b] : [b, a];
    const dmName = `dm:${userA}-${userB}`;

    // Проверяем, есть ли уже чат
    const existing = await this.prisma.chat.findFirst({
      where: { name: dmName, type: "DM" },
      select: { id: true },
    });

    if (existing) return existing.id;

    // Создаём новый DM
    const chat = await this.prisma.chat.create({
      data: {
        name: dmName,
        type: "DM",
        members: {
          create: [{ userId: userA }, { userId: userB }],
        },
      },
      select: { id: true },
    });

    return chat.id;
  }
}