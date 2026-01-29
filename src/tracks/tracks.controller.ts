import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TracksService } from './tracks.service';
import { StartTrackDto } from './dto/start-track.dto';
import { AddTrackPointDto } from './dto/add-track-point.dto';

@ApiTags('tracks')
@ApiBearerAuth()
@Controller('tracks')
export class TracksController {
  constructor(private readonly service: TracksService) {}

  @ApiOkResponse({ schema: { example: { id: 1, userId: 1, isActive: true } } })
  @Post('start')
  start(@CurrentUser() user: any, @Body() body: StartTrackDto) {
    return this.service.start(user.id, body.projectId);
  }

  @ApiOkResponse({ schema: { example: { id: 1, trackId: 1, lat: 50.1, lng: 30.2 } } })
  @Post(':id/point')
  addPoint(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddTrackPointDto,
  ) {
    return this.service.addPoint(user.id, id, body);
  }

  @ApiOkResponse({ schema: { example: { id: 1, isActive: false } } })
  @Post(':id/stop')
  stop(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.stop(user.id, id);
  }

  @ApiOkResponse({ schema: { example: [{ id: 1 }, { id: 2 }] } })
  @Get()
  list(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.service.list(user.id, date);
  }

  @ApiOkResponse({ schema: { example: { id: 1, points: [] } } })
  @Get(':id')
  get(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getTrack(user.id, id);
  }
}
