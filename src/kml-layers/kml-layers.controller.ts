import { Controller, Delete, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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

  @ApiOkResponse({
    schema: {
      example: { ok: true, deletedId: 123 },
    },
  })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteLayer(id);
    return { ok: true, deletedId: id };
  }
}
