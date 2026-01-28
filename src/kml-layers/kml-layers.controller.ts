import { Controller, Delete, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { KmlLayersService } from './kml-layers.service';

@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteLayer(id);
    return { ok: true, deletedId: id };
  }
}
