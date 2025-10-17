"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../../src/app.module");
describe('E2E', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    it('login employee', async () => {
        // assumes seed is applied in real environment
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'emp_it_1', password: 'emp_it_1' });
        expect([200, 201]).toContain(res.statusCode);
    });
    afterAll(async () => { await app.close(); });
});
