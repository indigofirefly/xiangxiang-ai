import { Controller, Get, Post, Body, Param, Query, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Post('add')
  addUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.addUser(createUserDto);
  }

  @Get('user-info/:id')
  getUserInfoById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserInfoById(id);
  }

  @Post('user-list')
  getUserList(@Query('page', ParseIntPipe) page: number, @Query('pageSize', ParseIntPipe) pageSize: number, @Body('name') name: string) {
    return this.userService.getUserList(page, pageSize, name);
  }
  
  @Put('update/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete('delete/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
