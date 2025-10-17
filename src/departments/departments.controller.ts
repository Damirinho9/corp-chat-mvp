import { Controller, Get, Post, Body, Req, UseGuards, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AuthGuard } from "../common/auth.guard";

@Controller("api/departments")
@UseGuards(AuthGuard)
export class DepartmentsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.department.findMany();
  }

  @Post()
  async create(@Req() req: any, @Body() body: { name: string }) {
    const me = await this.prisma.user.findUnique({ where: { id: req.userId } });
    if (me?.role !== "ADMIN") throw new ForbiddenException("admin_only");

    const dept = await this.prisma.department.create({ data: { name: body.name } });

    // обязательно создаем системный чат отдела
    const key = `dept_${dept.id}`;
    await this.prisma.chat.upsert({
      where: { systemKey: key },
      update: {},
      create: { type: "GROUP", name: `Отдел ${dept.name}`, departmentId: dept.id, systemKey: key },
    });

    return dept;
  }
}