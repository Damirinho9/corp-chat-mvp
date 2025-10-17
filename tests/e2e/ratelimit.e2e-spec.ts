
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E RateLimit', () => {
  let app: INestApplication;
  let server: any;
  beforeAll(async () => {
    process.env.RATE_LIMIT_COUNT = '3';
    process.env.RATE_LIMIT_WINDOW_MS = '2000';
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  it('limit triggers on 4th message in window', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'emp_it_1', password: 'emp_it_1' });
    // send to admin
    await agent.post('/api/messages/dm').send({ recipientId: 1, content: '1' });
    await agent.post('/api/messages/dm').send({ recipientId: 1, content: '2' });
    await agent.post('/api/messages/dm').send({ recipientId: 1, content: '3' });
    const r4 = await agent.post('/api/messages/dm').send({ recipientId: 1, content: '4' });
    expect(r4.statusCode).toBe(403);
  });

  afterAll(async ()=>{ await app.close(); });
});
