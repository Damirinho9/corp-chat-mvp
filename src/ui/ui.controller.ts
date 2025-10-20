import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';

@Controller()
export class UiController {
  private readonly viewsRoot = join(__dirname, 'views');

  @Get(['/', '/login'])
  login(@Res() res: any) {
    res.sendFile('login.html', { root: this.viewsRoot });
  }

  @Get('/app')
  app(@Res() res: any) {
    res.sendFile('app.html', { root: this.viewsRoot });
  }

  @Get('/admin')
  admin(@Res() res: any) {
    res.sendFile('admin.html', { root: this.viewsRoot });
  }

  @Get('/static/styles.css')
  css(@Res() res: any) {
    res
      .type('text/css')
      .send('body{font-family:sans-serif} .app{display:flex;gap:16px} aside{width:280px}');
  }
}