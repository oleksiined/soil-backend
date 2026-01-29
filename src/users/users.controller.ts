import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { SetActiveDto } from './dto/set-active.dto';
import { SetPasswordDto } from './dto/set-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @ApiOkResponse({ schema: { example: [{ id: 1, username: 'driver1', role: 'DRIVER', isActive: false, created_at: '...' }] } })
  @Get()
  list() {
    return this.service.listUsers();
  }

  @ApiOkResponse({ schema: { example: { id: 2, username: 'driver2', role: 'DRIVER', isActive: true, created_at: '...' } } })
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.service.createUser(body.username, body.password, body.role);
  }

  @ApiOkResponse({ schema: { example: { id: 1, username: 'driver1', role: 'DRIVER', isActive: true, created_at: '...' } } })
  @Patch(':id/active')
  setActive(@Param('id', ParseIntPipe) id: number, @Body() body: SetActiveDto) {
    return this.service.setActive(id, body.isActive);
  }

  @ApiOkResponse({ schema: { example: { ok: true } } })
  @Patch(':id/password')
  setPassword(@Param('id', ParseIntPipe) id: number, @Body() body: SetPasswordDto) {
    return this.service.setPassword(id, body.password);
  }
}
