
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E Auth', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  it('login admin1', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'admin1', password: 'admin1' });
    expect(res.statusCode).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
  });
  afterAll(async ()=>{ await app.close(); });
});
