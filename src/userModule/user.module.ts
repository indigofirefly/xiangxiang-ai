import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
@Module({
  imports: [MailModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
