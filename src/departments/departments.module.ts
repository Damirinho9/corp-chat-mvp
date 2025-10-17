import { Module } from "@nestjs/common";
import { DepartmentsController } from "./departments.controller";
import { PrismaService } from "../common/prisma.service";

@Module({
  controllers: [DepartmentsController],
  providers: [PrismaService],
})
export class DepartmentsModule {}
