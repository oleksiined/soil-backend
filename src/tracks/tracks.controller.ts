import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { TracksService } from './tracks.service';
import { CreateTrackPointDto } from './dto/create-track-point.dto';

@ApiTags('Tracks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tracks')
export class TracksController {
  constructor(private readonly service: TracksService) {}

  @Post('mission/:missionId/point')
  @Roles('ADMIN')
  addPoint(
    @Param('missionId') missionId: string,
    @Body() dto: CreateTrackPointDto,
  ) {
    return this.service.addPoint(Number(missionId), dto);
  }

  @Get('mission/:missionId')
  getByMission(@Param('missionId') missionId: string) {
    return this.service.getByMission(Number(missionId));
  }

  @Delete('mission/:missionId')
  @Roles('ADMIN')
  deleteByMission(@Param('missionId') missionId: string) {
    return this.service.deleteByMission(Number(missionId));
  }
}