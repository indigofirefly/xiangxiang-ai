import { Injectable, NotFoundException } from '@nestjs/common';
import dayjs from 'dayjs';
// import { MailService } from '../mail/mail.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

const DELETED_EMAIL_MARK = '#deleted#'

@Injectable()
export class UserService {
  // private readonly mailService: MailService,
    constructor( private readonly prisma: PrismaService) {}

    async addUser(createUserDto: CreateUserDto) {
      // this.mailService.sendWelcomeEmail(createUserDto.email ?? 'unknown@example.com');
      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          phone: createUserDto.phone,
        }
      });
      return {
        message: "add user success",
        data: user
      };
    }

    async getUserInfoById(id: number) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: id,
          deletedAt: null,
        }
      });
      return {
        message: "get user info by id success",
        data: user
      }
    }

    async getUserList(page: number, pageSize: number, name: string) {
      const where = {
        name: {
          contains: name,
        },
        deletedAt: null,
      };
      const [userList, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.user.count({ where }),
      ]);
      return {
        message: "get user list success",
        data: {
          total,
          page,
          pageSize,
          rows: userList,
        },
      };
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
      const user = await this.prisma.user.update({
        where: {
          id: id,
          deletedAt: null,
        },
        data: updateUserDto
      });
      return {
        message: "update user success",
        data: user
      };
    }

    async deleteUser(id: number) {
      const user = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });
        if (!existing) {
          throw new NotFoundException('用户不存在或已删除');
        }
        // 改写邮箱，释放原地址，避免和 email 唯一约束冲突
        return tx.user.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            email: `${existing.email}${DELETED_EMAIL_MARK}${existing.id}`,
          },
        });
      });
      return {
        message: `${user.name}删除成功`,
      };
    }
}
