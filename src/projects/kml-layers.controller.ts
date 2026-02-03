import { Controller, Get, Param } from '@nestjs/common';
import { KmlLayersService } from '../kml-layers/kml-layers.service';

@Controller('projects/:projectId/kml-layers')
export class ProjectKmlLayersController {
  constructor(private readonly service: KmlLayersService) {}

  @Get()
  getByProject(@Param('projectId') projectId: number) {
    return this.service.getByProject(projectId);
  }
}
