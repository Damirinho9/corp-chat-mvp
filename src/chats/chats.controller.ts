import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  Req, 
  Param, 
  Query, 
  UseGuards, 
  ForbiddenException 
} from '@nestjs/common';
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

  // === Список чатов пользователя ===
  @Get()
  async list(@Req() req: any) {
    return this.chats.listForUser(req.userId);
  }

  // === Сообщения конкретного чата ===
  @Get(':id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit: string | number = 50,
  ) {
    const chatId = Number(id);
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);

    // Проверяем: либо участник, либо админ
    const member = await this.prisma.chatMember.findFirst({
      where: { chatId, userId: req.userId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!member && user?.role !== 'ADMIN') {
      // 💥 Возвращаем 403, чтобы фронт корректно отработал
      throw new ForbiddenException('forbidden');
    }

    const rows = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
      },
    });

    // Преобразуем под формат фронта
    return rows.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender,
    }));
  }

  // === Получить или создать личный чат (DM) ===
  @Post('dm')
  async getOrCreateDm(@Req() req: any, @Body() body: { recipientId: number }) {
    const userId = Number(req.userId);
    const recipientId = Number(body.recipientId);

    if (!recipientId || recipientId === userId) {
      throw new ForbiddenException('invalid_recipient');
    }

    return this.chats.getOrCreateDm(userId, recipientId);
  }

  // === Отправить сообщение в чат ===
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

  // === Отправить личное сообщение (DM) ===
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