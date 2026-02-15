import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post('project/:projectId')
  @Roles('ADMIN')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateMissionDto,
  ) {
    return this.missionsService.create(projectId, body);
  }

  @Get('project/:projectId')
  findByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.missionsService.findByProject(
      projectId,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @Roles('ADMIN')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, false);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, true);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOne(id);
  }
}
