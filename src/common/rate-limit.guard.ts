import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

type Bucket = { ts: number[] };
const buckets = new Map<number, Bucket>();
const LIMIT = Number(process.env.RATE_LIMIT_COUNT || 10);
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10000);

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.userId as number;
    const now = Date.now();
    let b = buckets.get(userId);
    if (!b) { b = { ts: [] }; buckets.set(userId, b); }
    b.ts = b.ts.filter(t => now - t < WINDOW_MS);
    if (b.ts.length >= LIMIT) throw new ForbiddenException("rate_limited");
    b.ts.push(now);
    return true;
  }
}
