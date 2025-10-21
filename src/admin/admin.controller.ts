import { 
  Controller, 
  Get, 
  Query, 
  Req, 
  UseGuards, 
  ForbiddenException, 
  Post, 
  Body, 
  Param 
} from "@nestjs/common";
import { AuthGuard } from "../common/auth.guard";
import { PrismaService } from "../common/prisma.service";
import { Prisma } from "@prisma/client";

@Controller("api/admin")
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  // === Проверка прав администратора ===
  private async assertAdmin(req: any) {
    const me = await this.prisma.user.findUnique({ where: { id: req.userId } });
    if (me?.role !== "ADMIN") throw new ForbiddenException("admin_only");
  }

  // === Вспомогательные методы ===
  private async ensureMember(chatId: number | null, userId: number) {
    if (!chatId) return;
    const exists = await this.prisma.chatMember.findFirst({ where: { chatId, userId } });
    if (!exists) await this.prisma.chatMember.create({ data: { chatId, userId } });
  }

  private async getOrCreateDeptChatId(deptId: number | null): Promise<number | null> {
    if (!deptId) return null;
    const key = `dept_${deptId}`;
    let chat = await this.prisma.chat.findUnique({ where: { systemKey: key } });
    if (!chat) {
      const dept = await this.prisma.department.findUnique({ where: { id: deptId } });
      chat = await this.prisma.chat.create({
        data: {
          type: "GROUP",
          name: `Отдел ${dept?.name || deptId}`,
          departmentId: deptId,
          systemKey: key,
        },
      });
    }
    return chat.id;
  }

  private async syncUserSystemGroups(user: any) {
    const leadership = await this.prisma.chat.findUnique({ where: { systemKey: "leadership" } });
    const leadership_heads = await this.prisma.chat.findUnique({ where: { systemKey: "leadership_heads" } });
    const deptKey = user.departmentId ? `dept_${user.departmentId}` : null;
    const dept = deptKey ? await this.prisma.chat.findUnique({ where: { systemKey: deptKey } }) : null;

    if (user.role === "ADMIN") {
      await this.ensureMember(leadership?.id ?? null, user.id);
      await this.ensureMember(leadership_heads?.id ?? null, user.id);
    } else if (user.role === "HEAD") {
      await this.ensureMember(leadership_heads?.id ?? null, user.id);
    }
    if (dept) await this.ensureMember(dept.id, user.id);
  }

  private async syncUserSystemGroupsFull(
    user: { id: number; role: string; departmentId: number | null },
    before?: { role?: string | null; departmentId?: number | null },
  ) {
    const leadership = await this.prisma.chat.findUnique({ where: { systemKey: "leadership" } });
    const leadership_heads = await this.prisma.chat.findUnique({ where: { systemKey: "leadership_heads" } });

    const newDeptChatId = await this.getOrCreateDeptChatId(user.departmentId ?? null);
    const oldDeptChatId = await this.getOrCreateDeptChatId(before?.departmentId ?? null);

    const should = new Set<number>();
    if (user.role === "ADMIN") {
      if (leadership?.id) should.add(leadership.id);
      if (leadership_heads?.id) should.add(leadership_heads.id);
    } else if (user.role === "HEAD") {
      if (leadership_heads?.id) should.add(leadership_heads.id);
    }
    if (newDeptChatId) should.add(newDeptChatId);

    const systemChatIds = [leadership?.id, leadership_heads?.id, newDeptChatId, oldDeptChatId]
      .filter(Boolean) as number[];
    if (systemChatIds.length === 0) return;

    const current = await this.prisma.chatMember.findMany({
      where: { userId: user.id, chatId: { in: systemChatIds } },
      select: { chatId: true },
    });
    const currentSet = new Set(current.map((m: { chatId: number }) => m.chatId));

    const toAdd = Array.from(should).filter((id) => !currentSet.has(id));
    const toRemove = Array.from(currentSet).filter((id) => !should.has(id));

    await this.prisma.$transaction(async (tx) => {
      for (const id of toAdd) {
        await tx.chatMember.create({ data: { chatId: id, userId: user.id } });
      }
      for (const id of toRemove) {
        await tx.chatMember.deleteMany({ where: { chatId: id, userId: user.id } });
      }
    });
  }

  // === Обновление пользователя ===
  @Post("users/:id")
  async updateUser(
    @Req() req: any,
    @Param("id") idParam: string,
    @Body()
    body: {
      displayName?: string;
      role?: string;
      departmentId?: number | null;
      managerId?: number | null;
    },
  ) {
    await this.assertAdmin(req);

    const id = Number(idParam);
    if (Number.isNaN(id)) throw new ForbiddenException("bad_id");
    if (body.hasOwnProperty("managerId") && body.managerId === id) {
      throw new ForbiddenException("manager_cannot_be_self");
    }

    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true, departmentId: true },
    });
    if (!before) throw new ForbiddenException("user_not_found");

    const data: Prisma.UserUpdateInput = {};
    if (typeof body.displayName === "string") data.displayName = body.displayName;
    if (typeof body.role === "string") data.role = body.role;
    if (Object.prototype.hasOwnProperty.call(body, "departmentId")) {
      data.departmentId = body.departmentId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "managerId")) {
      data.managerId = body.managerId ?? null;
    }

    const updated = await this.prisma.user.update({ where: { id }, data });

    await this.syncUserSystemGroupsFull(
      { id: updated.id, role: updated.role, departmentId: updated.departmentId ?? null },
      { role: before.role, departmentId: before.departmentId ?? null },
    );

    return updated;
  }

  // === Создание пользователя ===
  @Post("users")
  async createUser(
    @Req() req: any,
    @Body()
    body: {
      username: string;
      displayName: string;
      role: string;
      departmentId?: number;
      password: string;
    },
  ) {
    await this.assertAdmin(req);

    const pwd = body.password || "";
    const tooShort = pwd.length < 8;
    const sameAsUser = pwd.toLowerCase() == (body.username || "").toLowerCase();
    const weak = !(/[a-zA-Z]/.test(pwd) && /\d/.test(pwd));

    if (tooShort || sameAsUser || weak) {
      throw new ForbiddenException("passwordTooWeak");
    }

    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash(
      body.password,
      Number(process.env.PASSWORD_SALT_ROUNDS || 10),
    );

    const user = await this.prisma.user.create({
      data: {
        username: body.username,
        displayName: body.displayName,
        role: body.role as any,
        departmentId: body.departmentId || null,
        passwordHash: hash,
      },
    });

    await this.syncUserSystemGroups(user);
    return user;
  }

  // === Список пользователей ===
  @Get("users")
  async listUsers(@Req() req: any) {
    await this.assertAdmin(req);
    return this.prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        departmentId: true,
      },
    });
  }

  // === Проверка пароля ===
  @Post("check-password")
  async yourMethod(@Body() body: { username?: string; password?: string }) {
    const pwd = body.password || "";
    const sameAsUser = pwd.toLowerCase() === (body.username || "").toLowerCase();
    return { sameAsUser };
  }

  // === Просмотр DM между двумя пользователями ===
  @Get("dms")
  async dms(@Req() req: any, @Query("a") a: string, @Query("b") b: string) {
    await this.assertAdmin(req);
    const aId = +a, bId = +b;

    const chat = await this.prisma.chat.findFirst({
      where: {
        type: "DM",
        AND: [
          { members: { some: { userId: aId } } },
          { members: { some: { userId: bId } } },
        ],
      },
      include: { members: true },
    });

    if (!chat) return [];
    return this.prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
    });
  }

  // === Аудит ===
  @Get("audit")
  async audit(@Req() req: any) {
    await this.assertAdmin(req);
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}