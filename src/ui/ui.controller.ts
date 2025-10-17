import { Controller, Get, Res } from "@nestjs/common";
import path from "path";

@Controller()
export class UiController {
  @Get(["/", "/login"]) login(@Res() res: any) { res.sendFile(path.join(process.cwd(), "src/ui/views/login.html")); }
  @Get("/app") app(@Res() res: any) { res.sendFile(path.join(process.cwd(), "src/ui/views/app.html")); }
  @Get("/admin") admin(@Res() res: any) { res.sendFile(path.join(process.cwd(), "src/ui/views/admin.html")); }
  @Get("/static/styles.css") css(@Res() res: any) { res.type("text/css").send("body{font-family:sans-serif} .app{display:flex;gap:16px} aside{width:280px}"); }
}
