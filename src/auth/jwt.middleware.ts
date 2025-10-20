import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request & { userId?: number; userRole?: string }, _res: Response, next: NextFunction) {
    let token: string | null = null;

    const h = req.headers['authorization'];
    if (typeof h === 'string' && h.startsWith('Bearer ')) token = h.slice(7);
    if (!token && (req as any).cookies?.access) token = (req as any).cookies.access;
    if (!token && typeof req.query?.access_token === 'string') token = String(req.query.access_token);

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        (req as any).userId = payload.sub ?? payload.id;
        (req as any).userRole = payload.role;
      } catch {}
    }
    next();
  }
}