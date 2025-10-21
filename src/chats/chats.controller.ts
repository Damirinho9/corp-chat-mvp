import { Body, Controller, Get, Post, Req, Param, Query, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../common/prisma.service';
import { AuthGuard } from '../common/auth.guard';

@Controller('api/chats')
@UseGuards(AuthGuard)
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly messages: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    return this.chats.listForUser(req.userId);
  }

  @Get(':id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit: string | number = 50,
  ) {
    const chatId = Number(id);
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);

    // Проверка членства или роли ADMIN
    const member = await this.prisma.chatMember.findFirst({
      where: { chatId, userId: req.userId },
    });
    const user = await this.prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { role: true }
    });
    
    if (!member && user?.role !== 'ADMIN') {
      return { error: 'Доступ запрещен' };
    }

    const rows = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
      },
    });

    return rows.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender,
    }));
  }

  @Post('dm')
  async getOrCreateDm(@Req() req: any, @Body() body: { recipientId: number }) {
    const userId = Number(req.userId);
    const recipientId = Number(body.recipientId);

    if (!recipientId || recipientId === userId) {
      return { error: 'Некорректный recipientId' };
    }

    return this.chats.getOrCreateDm(userId, recipientId);
  }

  @Post('messages/chat')
  async sendToChat(
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
  async sendDm(
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