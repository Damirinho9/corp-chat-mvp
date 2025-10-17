import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { WinstonModule } from "nest-winston";
import { appLoggerOptions } from "./common/logging";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(appLoggerOptions),
  });

  // здесь можно оставить другие middlewares, CORS, pipes и пр., если были
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000, "0.0.0.0");
}
bootstrap();