// src/chats/chats.controller.ts
import { Controller, Get, Req, Post, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { MessagesService } from '../messages/messages.service';

@Controller('api/chats')
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly messages: MessagesService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    // Если есть реализация: return this.chats.listForUser(req.userId);
    return []; // временная заглушка, чтобы фронт не падал
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