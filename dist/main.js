"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const nest_winston_1 = require("nest-winston");
const logging_1 = require("./common/logging");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: nest_winston_1.WinstonModule.createLogger(logging_1.appLoggerOptions),
    });
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000, "0.0.0.0");
}
bootstrap();
