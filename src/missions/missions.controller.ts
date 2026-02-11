import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
  @ApiOperation({ summary: 'Create mission for project' })
  @Roles('ADMIN')
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
  @ApiOperation({ summary: 'Archive mission' })
  @Roles('ADMIN')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive mission' })
  @Roles('ADMIN')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.setArchived(id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete mission' })
  @Roles('ADMIN')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.delete(id);
  }
}
