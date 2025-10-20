import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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

    // Куки — удобно для SSR/админки
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

  @Post('refresh')
  async refresh(@Body() _dto: any, @Res({ passthrough: true }) res: Response) {
    const refresh = (res.req as any).cookies?.['refresh'];
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET!) as any;

    const access = jwt.sign(
      { sub: payload.sub ?? payload.id },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' },
    );

    res.cookie('access', access, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    // Можно вернуть и сюда, если фронт так проще обновлять:
    return { ok: true, accessToken: access };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access');
    res.clearCookie('refresh');
    return { ok: true };
  }
}