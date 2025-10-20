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

  // ✅ исправленный метод для DM: обязательно указываем type: 'DM'
  @Post('dm')
  async getOrCreateDm(@Req() req: any, @Body() body: { recipientId: number }) {
    const userId = Number(req.userId);
    const recipientId = Number(body.recipientId);

    if (!recipientId || recipientId === userId) {
      return { error: 'Некорректный recipientId' };
    }

    // детерминированное имя чата
    const [a, b] = [userId, recipientId].sort((x, y) => x - y);
    const dmName = `dm:${a}-${b}`;

    // 1) ищем уже созданный DM
    let chat = await this.prisma.chat.findFirst({
      where: { name: dmName, type: 'DM' },
    });

    // 2) если нет — создаём (type обязателен в модели)
    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { name: dmName, type: 'DM' },
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