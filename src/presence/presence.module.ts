import { Module } from "@nestjs/common";
import { PresenceService } from "./presence.service";
import { PresenceController } from "./presence.controller";
import { PrismaService } from "../common/prisma.service";

@Module({
  providers: [PresenceService, PrismaService],
  controllers: [PresenceController],
  exports: [PresenceService],
})
export class PresenceModule {}