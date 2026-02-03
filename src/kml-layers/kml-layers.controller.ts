import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { KmlLayersService } from './kml-layers.service';

@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: number) {
    return this.service.getByProject(Number(projectId));
  }

  @Post('project/:projectId')
  create(
    @Param('projectId') projectId: number,
    @Body() body: { name: string; content: string },
  ) {
    return this.service.create(body.name, body.content, Number(projectId));
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(Number(id));
  }
}
