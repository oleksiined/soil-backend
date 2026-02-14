import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Create mission for project' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateMissionDto,
  ) {
    return this.missionsService.create(projectId, body);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get missions by project' })
  findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.missionsService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mission by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOne(id);
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive mission' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unarchive mission' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, false);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete mission' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.delete(id);
  }
}
