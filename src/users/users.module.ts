import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { PrismaService } from "../common/prisma.service";
import { RbacService } from "../common/rbac/rbac.service";

@Module({
  controllers: [UsersController],
  providers: [PrismaService, RbacService],
})
export class UsersModule {}
