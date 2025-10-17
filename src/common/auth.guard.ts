import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.access;
    if (!token) throw new UnauthorizedException("no_token");
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
      req.userId = payload.sub;
      req.userRole = payload.role;
      return true;
    } catch {
      throw new UnauthorizedException("invalid_token");
    }
  }
}
