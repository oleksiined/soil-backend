import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post('project/:projectId')
  @ApiOperation({ summary: 'Create mission in project' })
  @Roles('ADMIN')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateMissionDto,
  ) {
    return this.missionsService.create(projectId, dto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get missions by project' })
  @Roles('ADMIN', 'USER')
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.missionsService.getByProject(projectId, includeArchived === 'true');
  }

  @Get(':missionId')
  @ApiOperation({ summary: 'Get mission by id' })
  @Roles('ADMIN', 'USER')
  getById(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.getById(missionId);
  }

  @Patch(':missionId/archive')
  @ApiOperation({ summary: 'Archive mission' })
  @Roles('ADMIN')
  archive(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.archive(missionId);
  }

  @Patch(':missionId/unarchive')
  @ApiOperation({ summary: 'Unarchive mission' })
  @Roles('ADMIN')
  unarchive(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.unarchive(missionId);
  }

  @Delete(':missionId')
  @ApiOperation({ summary: 'Delete mission' })
  @Roles('ADMIN')
  delete(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.delete(missionId);
  }

  @Get(':missionId/summary')
  @ApiOperation({ summary: 'Get mission GPS summary (PostGIS)' })
  @Roles('ADMIN', 'USER')
  getSummary(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.getSummary(missionId);
  }

  @Get(':missionId/route.geojson')
  @ApiOperation({ summary: 'Get mission route as GeoJSON LineString' })
  @Roles('ADMIN', 'USER')
  getRoute(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.missionsService.getRouteGeoJson(missionId);
  }

  @Get(':missionId/points-in-radius')
  @ApiOperation({ summary: 'Get mission track points within radius (meters) from a coordinate (ST_DWithin)' })
  @Roles('ADMIN', 'USER')
  getPointsInRadius(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radius: number,
  ) {
    return this.missionsService.getPointsInRadius(missionId, lat, lng, radius);
  }

  @Get(':missionId/coverage/:fieldId')
  @ApiOperation({ summary: 'Get polygon coverage percent using route buffer ∩ field polygon (from KML in kml_layers)' })
  @Roles('ADMIN', 'USER')
  getCoveragePercent(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Query('width', ParseFloatPipe) width: number,
  ) {
    // width = ширина захвату в метрах (типово 6)
    return this.missionsService.getCoveragePercent(missionId, fieldId, width || 6);
  }
}