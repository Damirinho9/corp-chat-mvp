import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    
    // Попытка извлечь токен из разных источников
    let token: string | null = null;
    
    // 1. Из заголовка Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    
    // 2. Из httpOnly cookie (для SSR/старых клиентов)
    if (!token && req.cookies?.access) {
      token = req.cookies.access;
    }
    
    // 3. Из query параметра (для SSE EventSource)
    if (!token && typeof req.query?.access_token === 'string') {
      token = req.query.access_token;
    }
    
    if (!token) throw new UnauthorizedException("no_token");
    
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
      req.userId = payload.sub ?? payload.id;
      req.userRole = payload.role;
      return true;
    } catch (err) {
      throw new UnauthorizedException("invalid_token");
    }
  }
}