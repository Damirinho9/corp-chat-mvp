import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AuthGuard } from "../common/auth.guard";
import { RbacService } from "../common/rbac/rbac.service";

@Controller("api/users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private prisma: PrismaService, private rbac: RbacService) {}

  @Get("me")
  async me(@Req() req: any) {
    return this.prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, displayName: true, role: true, departmentId: true, managerId: true } });
    }

  // поиск только по разрешенным адресатам для ЛС
  @Get("search")
  async search(@Req() req: any, @Query("q") q: string) {
    const me = await this.prisma.user.findUnique({ where: { id: req.userId } });
    const users = await this.prisma.user.findMany({ where: { username: { contains: q || "" } } });
    return users.filter((u: any) => this.rbac.checkDmPermission(me!, u).allow).map((u: any) => ({ id: u.id, username: u.username, displayName: u.displayName, role: u.role, departmentId: u.departmentId }));
  }
}
