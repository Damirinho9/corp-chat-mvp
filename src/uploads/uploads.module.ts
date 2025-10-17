import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { UploadsController } from "./uploads.controller";
import { PrismaService } from "../common/prisma.service";

@Module({
  imports: [
    MulterModule.register({
      dest: "uploads",
      limits: { fileSize: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024 },
    }),
  ],
  controllers: [UploadsController],
  providers: [PrismaService],
})
export class UploadsModule {}