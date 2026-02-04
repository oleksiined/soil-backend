import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { KmlLayersService } from './kml-layers.service';
import { CreateKmlLayerDto } from './dto/create-kml-layer.dto';

@ApiTags('KmlLayers')
@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @Post('project/:projectId')
  @ApiOperation({ summary: 'Create KML layer for project' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateKmlLayerDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get KML layers by project' })
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.service.getByProject(projectId);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive KML layer' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive KML layer' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete KML layer' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
