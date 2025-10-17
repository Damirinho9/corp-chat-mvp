import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { auditLogger } from "./logging";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    // Middleware для логирования AuditLog.create в файл
    this.$use(async (params, next) => {
      const result = await next(params);
      try {
        if (params.model === "AuditLog" && params.action === "create") {
          const data = params.args?.data || {};
          auditLogger.info({
            time: new Date().toISOString(),
            actorId: data.actorId ?? null,
            action: data.action ?? null,
            targetId: data.targetId ?? null,
            resource: data.resource ?? null,
            outcome: data.outcome ?? null,
            reason: data.reason ?? null,
          });
        }
      } catch (_) {
        // Не ломаем бизнес-логику при ошибке логгирования
      }
      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}