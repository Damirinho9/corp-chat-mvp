import { Module } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { PrismaService } from "../common/prisma.service";
import { RbacService } from "../common/rbac/rbac.service";

@Module({
  providers: [MessagesService, PrismaService, RbacService],
  exports: [MessagesService]
})
export class MessagesModule {}
