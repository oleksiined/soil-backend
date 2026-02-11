import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { KmlLayersService } from './kml-layers.service';
import { CreateKmlLayerDto } from './dto/create-kml-layer.dto';

@ApiTags('KmlLayers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @Post('project/:projectId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create KML layer for project' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateKmlLayerDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get KML layers by project' })
  getByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getByProject(projectId);
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive KML layer' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unarchive KML layer' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete KML layer' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
