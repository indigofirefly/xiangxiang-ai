import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { MailService } from '../mail/mail.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
    constructor(private readonly mailService: MailService) {}
    getUserInfo() {
      return [{ name: "xiangxiang", age: 18, gender: "male", timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'), id: 1 }];
    }

    addUser(createUserDto: CreateUserDto) {
      this.mailService.sendWelcomeEmail(createUserDto.email ?? 'unknown@example.com');
      console.log('createUserDto===>' + JSON.stringify(createUserDto, null, 2));
      return {
        message: "add user success",
        data: createUserDto
      };
    }
    getUserInfoById(id: number) {
      return {
        message: "get user info by id success",
        data: {
          id: id,
          name: "xiangxiang",
          age: 18,
          gender: "male"
        }
      };
    }
    getUserList(page: number, pageSize: number) {
      const currentPage = page || 1;
      const currentPageSize = pageSize || 20;
      return {
        message: "get user list success",
        data: {
          page: currentPage,
          pageSize: currentPageSize,
        }
      };
    }
    deleteUser(id: number) {
      return {
        message: "delete user success",
        data: {
          id: id,
        }
      };
    }
    updateUser(id: number, updateUserDto: UpdateUserDto) {
      return {
        message: "update user success",
        data: {
          id: id,
          ...updateUserDto
        }
      };
    }
}
