import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './userModule/user.module.js';
import { DemoModule } from './demo/demo.module.js';
@Module({
  imports: [UserModule, DemoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
