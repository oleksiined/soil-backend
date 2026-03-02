import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MissionsService } from './missions.service';
import { MissionSummaryDto } from './dto/mission-summary.dto';
import { MissionRouteGeoJsonDto } from './dto/mission-route-geojson.dto';

@ApiTags('Missions')
@ApiBearerAuth()
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get(':missionId/summary')
  @ApiOperation({ summary: 'Get mission GPS summary' })
  @ApiParam({ name: 'missionId', type: Number })
  async getSummary(
    @Param('missionId', ParseIntPipe) missionId: number,
  ): Promise<MissionSummaryDto> {
    return this.missionsService.getSummary(missionId);
  }

  @Get(':missionId/route.geojson')
  @ApiOperation({ summary: 'Get mission route as GeoJSON LineString' })
  @ApiParam({ name: 'missionId', type: Number })
  async getRoute(
    @Param('missionId', ParseIntPipe) missionId: number,
  ): Promise<MissionRouteGeoJsonDto> {
    return this.missionsService.getRouteGeoJson(missionId);
  }
}