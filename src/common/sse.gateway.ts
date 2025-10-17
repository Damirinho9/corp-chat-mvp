import {
  Controller,
  Sse,
  MessageEvent,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { Observable, Subject, merge } from "rxjs";
import { PresenceService } from "../presence/presence.service";

const subjects = new Map<number, Subject<MessageEvent>>();

@Controller("api")
export class SseGateway {
  constructor(private readonly presence: PresenceService) {}

  @Sse("events")
  @UseGuards(AuthGuard)
  events(@Req() req: any): Observable<MessageEvent> {
    const userId = req.userId;
    if (!userId) return new Subject<MessageEvent>().asObservable();

    // создаём Subject для личных событий (новые сообщения и т.д.)
    let sub = subjects.get(userId);
    if (!sub) {
      sub = new Subject<MessageEvent>();
      subjects.set(userId, sub);
    }

    // --- присутствие ---
    this.presence.markOnline(userId).catch(() => {});
    req.on("close", () => {
      this.presence.markOffline(userId).catch(() => {});
    });

    // объединяем персональный поток и поток событий присутствия
    const personal$ = sub.asObservable();
    const presence$ = this.presence.events$ as unknown as Observable<MessageEvent>;

    return merge(personal$, presence$);
  }
}

/**
 * pushTo — послать событие конкретному пользователю
 */
export function pushTo(userId: number, data: any) {
  const sub = subjects.get(userId);
  if (sub) sub.next({ data: JSON.stringify(data) } as any);
}