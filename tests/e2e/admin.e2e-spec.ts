
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E Admin', () => {
  let app: INestApplication;
  let server: any;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  it('admin can view audit', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'admin1', password: 'admin1' });
    const r = await agent.get('/api/admin/audit');
    expect(r.statusCode).toBe(200);
  });

  it('admin can read DM between 1 and 3', async () => {
    const agent = request.agent(server);
    await agent.post('/api/auth/login').send({ username: 'admin1', password: 'admin1' });
    const r = await agent.get('/api/admin/dms?a=1&b=3');
    expect(r.statusCode).toBe(200);
  });

  afterAll(async ()=>{ await app.close(); });
});
