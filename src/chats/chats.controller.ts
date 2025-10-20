import { Body, Controller, Post, Req } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { MessagesService } from "../messages/messages.service";

// 👇 изменено
@Controller("api/chats")
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly messages: MessagesService
  ) {}

  @Post("messages/chat")
  sendToChat(
    @Req() req: any,
    @Body() body: { chatId: number; content?: string; attachmentIds?: number[] }
  ) {
    return this.messages.sendToChat(
      req.userId,
      body.chatId,
      body.content || "",
      body.attachmentIds || []
    );
  }

  @Post("messages/dm")
  sendDm(
    @Req() req: any,
    @Body() body: {
      recipientId: number;
      content?: string;
      attachmentIds?: number[];
    }
  ) {
    return this.messages.sendDm(
      req.userId,
      body.recipientId,
      body.content || "",
      body.attachmentIds || []
    );
  }
}