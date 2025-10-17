import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { auditLogger } from "./logging";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();

    // ✅ новый способ подключения middleware через $extends
    const extended = this.$extends({
      query: {
        auditLog: {
          async create({ args, query }) {
            const result = await query(args);
            try {
              const data = args?.data || {};
              auditLogger.info({
                time: new Date().toISOString(),
                actorId: data.actorId ?? null,
                action: data.action ?? null,
                targetId: data.targetId ?? null,
                resource: data.resource ?? null,
                outcome: data.outcome ?? null,
                reason: data.reason ?? null,
              });
            } catch {
              // не ломаем логику при сбое логгера
            }
            return result;
          },
        },
      },
    });

    // заменяем this на расширенный клиент
    Object.assign(this, extended);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}