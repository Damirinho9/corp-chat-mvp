
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E DM', () => {
  let app: INestApplication;
  let server: any;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  it('employee -> admin allow', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'emp_it_1', password: 'emp_it_1' });
    const r = await agent.post('/api/messages/dm').send({ recipientId: 1, content: 'hi admin' });
    expect([200,201]).toContain(r.statusCode);
  });

  it('employee -> employee deny', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'emp_it_1', password: 'emp_it_1' });
    const r = await agent.post('/api/messages/dm').send({ recipientId: 4, content: 'hi peer' }); // sales employee
    expect(r.statusCode).toBe(403);
  });

  afterAll(async ()=>{ await app.close(); });
});
