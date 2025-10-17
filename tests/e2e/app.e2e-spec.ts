import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('login employee', async () => {
    // assumes seed is applied in real environment
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'emp_it_1', password: 'emp_it_1' });
    expect([200,201]).toContain(res.statusCode);
  });

  afterAll(async () => { await app.close(); });
});
