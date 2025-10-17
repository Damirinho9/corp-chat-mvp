import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendToChat(
    senderId: number,
    chatId: number,
    content: string,
    attachmentIds: number[],
  ) {
    const me = await this.prisma.user.findUnique({ where: { id: senderId } });
    const member = await this.prisma.chatMember.findFirst({
      where: { chatId, userId: senderId },
    });

    if (me?.role !== "ADMIN" && !member) {
      throw new ForbiddenException("not_a_member");
    }

    if (!content && (!attachmentIds || attachmentIds.length === 0)) {
      throw new ForbiddenException("empty_message");
    }

    const msg = await this.prisma.message.create({
      data: { chatId, senderId, content: content || "" },
    });

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

    return this.prisma.message.findUnique({
      where: { id: msg.id },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        attachments: true,
      },
    });
  }

  async sendDm(
    senderId: number,
    recipientId: number,
    content: string,
    attachmentIds: number[],
  ) {
    const dmChat = await this.getOrCreateDmChatId(senderId, recipientId);
    return this.sendToChat(senderId, dmChat, content, attachmentIds);
  }

  async list(
    chatId: number,
    requesterId: number,
    opts?: { before?: string; after?: string; limit?: number },
  ) {
    // TODO: сюда можно вставить проверку доступа, если ещё не реализовано

    return this.prisma.message.findMany({
      where: {
        chatId,
        ...(opts?.before && { createdAt: { lt: new Date(opts.before) } }),
        ...(opts?.after && { createdAt: { gt: new Date(opts.after) } }),
      },
      orderBy: { createdAt: "desc" },
      take: opts?.limit || 20,
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        attachments: true,
      },
    });
  }

  private async getOrCreateDmChatId(a: number, b: number): Promise<number> {
    const [userA, userB] = a < b ? [a, b] : [b, a];

    const existing = await this.prisma.chat.findFirst({
      where: {
        isDirect: true,
        members: {
          every: { userId: { in: [userA, userB] } },
        },
      },
      select: { id: true },
    });

    if (existing) return existing.id;

    const chat = await this.prisma.chat.create({
      data: {
        name: `DM ${userA}-${userB}`, // или "Direct Chat"
        type: "direct",
        isDirect: true,
        members: {
          create: [{ userId: userA }, { userId: userB }],
        },
      },
      select: { id: true },
    });


    return chat.id;
  }
}