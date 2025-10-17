import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { MessagesService } from "../messages/messages.service";
import { PrismaService } from "../common/prisma.service";
import { RbacService } from "../common/rbac/rbac.service";

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, MessagesService, PrismaService, RbacService],
})
export class ChatsModule {}
