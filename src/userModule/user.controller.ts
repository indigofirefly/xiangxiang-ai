import { Controller, Get, Post, Body, Param, Query, Delete, Put } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user-info')
  getUserInfo() {
    return this.userService.getUserInfo();
  }

  @Post('add')
  addUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.addUser(createUserDto);
  }

  @Get('/userInfo/:id')
  getUserInfoById(@Param('id') id: number) {
    return this.userService.getUserInfoById(id);
  }
  // list?page=1&size=10
  @Get('user-list')
  getUserList(@Query('page') page: number, @Query('pageSize') pageSize: number) {
    return this.userService.getUserList(page, pageSize);
  }
  @Put('update/:id')
  updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }
  @Delete('delete/:id')
  deleteUser(@Param('id') id: number) {
    return this.userService.deleteUser(id);
  }
}
