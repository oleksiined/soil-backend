import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @ApiOkResponse({
    schema: {
      example: [
        { id: 1, username: 'admin', role: 'ADMIN', isActive: true },
        { id: 2, username: 'driver1', role: 'DRIVER', isActive: false },
      ],
    },
  })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOkResponse({
    schema: {
      example: { id: 2, username: 'driver1', role: 'DRIVER', isActive: true },
    },
  })
  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActive(id, true);
  }

  @ApiOkResponse({
    schema: {
      example: { id: 2, username: 'driver1', role: 'DRIVER', isActive: false },
    },
  })
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActive(id, false);
  }
}
