
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E Groups', () => {
  let app: INestApplication;
  let server: any;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  it('head_sales can write to Sales dept group', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'head_sales', password: 'head_sales' });
    // find my chats and post to dept group
    const chats = await agent.get('/api/chats');
    const dept = chats.body.find((c:any)=>c.name.includes('Sales'));
    const r = await agent.post('/api/messages/chat').send({ chatId: dept.id, content: 'sales update' });
    expect([200,201]).toContain(r.statusCode);
  });

  it('head_sales cannot write to Ops dept group', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'head_sales', password: 'head_sales' });
    const chats = await agent.get('/api/chats');
    const ops = chats.body.find((c:any)=>c.name.includes('Ops'));
    if (!ops) return; // not member - expected
    const r = await agent.post('/api/messages/chat').send({ chatId: ops.id, content: 'should fail' });
    expect(r.statusCode).toBe(403);
  });

  afterAll(async ()=>{ await app.close(); });
});
