import { Controller, Post, Req } from "@nestjs/common";
import { PresenceService } from "./presence.service";

@Controller("/api/presence")
export class PresenceController {
  constructor(private presence: PresenceService) {}

  @Post("ping")
  async ping(@Req() req: any) {
    if (!req.userId) return { ok: false };
    await this.presence.ping(req.userId);
    return { ok: true };
  }
}