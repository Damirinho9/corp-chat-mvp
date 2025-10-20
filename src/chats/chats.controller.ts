import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../common/prisma.service';

@Controller('api/chats')
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly messages: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    // TODO: можно потом заменить на chats.listForUser(req.userId)
    return [];
  }

  // ✅ Новый маршрут: создание/получение личного чата
  @Post('dm')
  async getOrCreateDm(@Req() req: any, @Body() body: { recipientId: number }) {
    const userId = req.userId;
    const recipientId = body.recipientId;

    if (!recipientId || recipientId === userId) {
      return { error: 'Некорректный recipientId' };
    }

    // ищем существующий чат между этими двумя пользователями
    let chat = await this.prisma.chat.findFirst({
      where: {
        isDirect: true,
        participants: {
          every: {
            userId: { in: [userId, recipientId] },
          },
        },
      },
    });

    // если нет — создаём
    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          isDirect: true,
          name: null,
          participants: {
            create: [
              { userId },
              { userId: recipientId },
            ],
          },
        },
      });
    }

    return chat;
  }

  @Post('messages/chat')
  sendToChat(
    @Req() req: any,
    @Body() body: { chatId: number; content?: string; attachmentIds?: number[] },
  ) {
    return this.messages.sendToChat(
      req.userId,
      body.chatId,
      body.content || '',
      body.attachmentIds || [],
    );
  }

  @Post('messages/dm')
  sendDm(
    @Req() req: any,
    @Body() body: { recipientId: number; content?: string; attachmentIds?: number[] },
  ) {
    return this.messages.sendDm(
      req.userId,
      body.recipientId,
      body.content || '',
      body.attachmentIds || [],
    );
  }
}