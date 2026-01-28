import { ApiProperty } from '@nestjs/swagger';
import { ProjectDto } from './project.dto';
import { KmlLayerDto } from './kml-layer.dto';

export class ProjectDetailsDto {
  @ApiProperty({ type: ProjectDto })
  project: ProjectDto;

  @ApiProperty({ type: [KmlLayerDto] })
  kmlLayers: KmlLayerDto[];
}
