import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { PresenceModule } from './presence/presence.module';

import { PrismaService } from './common/prisma.service';
import { RbacService } from './common/rbac/rbac.service';
import { UiController } from './ui/ui.controller';
import { SseGateway } from './common/sse.gateway';
import { JwtMiddleware } from './auth/jwt.middleware';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ChatsModule,
    MessagesModule,
    AdminModule,
    UploadsModule,
    PresenceModule,
  ],
  controllers: [UiController, SseGateway],
  providers: [PrismaService, RbacService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), JwtMiddleware).forRoutes('*');
  }
}