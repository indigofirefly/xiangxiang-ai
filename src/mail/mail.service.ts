import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  sendWelcomeEmail(email: string) {
    console.log(`[MailService] 发送欢迎邮件到 ${email}`);
  }
}
