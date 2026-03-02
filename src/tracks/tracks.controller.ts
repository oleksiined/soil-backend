import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { TracksService } from './tracks.service';
import { CreateTrackPointDto } from './dto/create-track-point.dto';

@ApiTags('Tracks')
@ApiBearerAuth()
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post('mission/:missionId/point')
  @ApiOperation({ summary: 'Add single GPS track point to mission' })
  @ApiParam({ name: 'missionId', type: Number })
  async addPoint(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Body() dto: CreateTrackPointDto,
  ) {
    return this.tracksService.addPoint(missionId, dto);
  }

  @Post('mission/:missionId/batch')
  @ApiOperation({ summary: 'Add batch of GPS track points to mission' })
  @ApiParam({ name: 'missionId', type: Number })
  @ApiBody({ type: [CreateTrackPointDto] })
  async addBatch(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Body(
      new ParseArrayPipe({
        items: CreateTrackPointDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    points: CreateTrackPointDto[],
  ) {
    return this.tracksService.addBatch(missionId, points);
  }

  @Get('mission/:missionId')
  @ApiOperation({ summary: 'Get all GPS track points for mission' })
  @ApiParam({ name: 'missionId', type: Number })
  async getByMission(
    @Param('missionId', ParseIntPipe) missionId: number,
  ) {
    return this.tracksService.getByMission(missionId);
  }

  @Delete('mission/:missionId')
  @ApiOperation({ summary: 'Delete all GPS track points for mission' })
  @ApiParam({ name: 'missionId', type: Number })
  async deleteByMission(
    @Param('missionId', ParseIntPipe) missionId: number,
  ) {
    return this.tracksService.deleteByMission(missionId);
  }
}