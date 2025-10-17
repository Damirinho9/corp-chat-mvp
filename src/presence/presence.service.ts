import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { Subject } from "rxjs";

type Status = "ONLINE" | "OFFLINE" | "AWAY";
type PresenceEvent = { type: "presence"; userId: number; status: Status; at: string };

@Injectable()
export class PresenceService {
  private readonly log = new Logger(PresenceService.name);
  private inactivityTimers = new Map<number, NodeJS.Timeout>();
  private awayAfterMs = Number(process.env.PRESENCE_AWAY_MS || 5 * 60 * 1000); // 5 минут до away
  public events$ = new Subject<PresenceEvent>();
  private statuses = new Map<number, Status>();

  constructor(private prisma: PrismaService) {}

  // ---------- Вспомогательные ----------
  private emit(userId: number, status: Status) {
    this.events$.next({ type: "presence", userId, status, at: new Date().toISOString() });
  }

  private clearTimer(userId: number) {
    const t = this.inactivityTimers.get(userId);
    if (t) clearTimeout(t);
    this.inactivityTimers.delete(userId);
  }

  private armAwayTimer(userId: number) {
    this.clearTimer(userId);
    const t = setTimeout(() => this.markAway(userId), this.awayAfterMs);
    this.inactivityTimers.set(userId, t);
  }

  private async safeUpdate(userId: number, data: any) {
    try {
      await this.prisma.user.update({ where: { id: userId }, data });
    } catch (e) {
      this.log.warn(`Failed to update user ${userId} presence: ${String(e)}`);
    }
  }

  private async broadcast(userId: number, status: Status) {
    this.emit(userId, status);
  }

  // ---------- Унифицированный метод ----------
  private async setStatus(userId: number, status: Status) {
    const prev = this.statuses.get(userId);
    if (prev === status) {
      if (status === "ONLINE") {
        await this.safeUpdate(userId, { lastActiveAt: new Date() });
      }
      return;
    }

    this.statuses.set(userId, status);
    const data =
      status === "ONLINE"
        ? { status, lastActiveAt: new Date() }
        : { status };

    await this.safeUpdate(userId, data);

    // 🟢 журналирование
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: "presence",
          resource: "status",
          outcome: status,
          targetId: userId,
        },
      });
    } catch (e) {
      this.log.warn(`AuditLog presence insert failed for user ${userId}: ${String(e)}`);
    }

    this.broadcast(userId, status);
  }

  // ---------- Публичные методы ----------
  async markOnline(userId: number) {
    this.clearTimer(userId);
    await this.setStatus(userId, "ONLINE");
    this.armAwayTimer(userId);
  }

  async markAway(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!u || u.status === "OFFLINE") return;
    await this.setStatus(userId, "AWAY");
    // Не ставим новый таймер — оживится только при ping
  }

  async markOffline(userId: number) {
    this.clearTimer(userId);
    await this.setStatus(userId, "OFFLINE");
  }

  async ping(userId: number) {
    await this.setStatus(userId, "ONLINE");
    this.armAwayTimer(userId);
  }
}