import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException("invalid_credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("invalid_credentials");
    return user;
  }

  issueTokens(user: { id: number; role: string }) {
    const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
    const refresh = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
    return { access, refresh };
  }
}
