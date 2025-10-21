import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  // === LOGIN ===
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateUser(body.username, body.password);

    const { access, refresh } = this.auth.issueTokens({
      id: user.id,
      role: user.role,
    });

    // Куки — для SSR/админки
    res.cookie('access', access, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh', refresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // JSON — для SPA: фронт сохранит accessToken в localStorage
    return {
      accessToken: access,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        departmentId: user.departmentId,
      },
    };
  }

  // === REFRESH ===
  @Post('refresh')
  async refresh(@Body() _: any, @Res({ passthrough: true }) res: Response) {
    const refresh = (res.req as any).cookies?.['refresh'];
    if (!refresh) throw new UnauthorizedException('no_refresh_token');

    let payload: any;
    try {
      payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET!);
    } catch (e) {
      throw new UnauthorizedException('invalid_refresh');
    }

    // 🔹 Получаем роль из базы, чтобы она всегда была актуальной
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub ?? payload.id },
      select: { id: true, role: true },
    });
    if (!user) throw new UnauthorizedException('user_not_found');

    const access = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' },
    );

    // Ставим новый access-cookie
    res.cookie('access', access, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    // Можно вернуть токен фронту (для localStorage)
    return { ok: true, accessToken: access };
  }

  // === LOGOUT ===
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access');
    res.clearCookie('refresh');
    return { ok: true };
  }
}