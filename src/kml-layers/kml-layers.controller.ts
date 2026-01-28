import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayerDto } from '../projects/dto/kml-layer.dto';

@ApiTags('kml-layers')
@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @ApiOkResponse({ type: KmlLayerDto })
  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @ApiOkResponse({ type: KmlLayerDto })
  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @ApiOkResponse({ schema: { example: { ok: true, deletedId: 123 } } })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteLayer(id);
    return { ok: true, deletedId: id };
  }

  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Get(':id/file')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { absPath, filename } = await this.service.getLayerFile(id);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return createReadStream(absPath).pipe(res);
  }
}
