import { ApiProperty } from '@nestjs/swagger';
import { ProjectDto } from './project.dto';
import { KmlLayerDto } from './kml-layer.dto';

export class ProjectsSyncDto {
  @ApiProperty()
  serverTime: string;

  @ApiProperty({ type: [ProjectDto] })
  projects: ProjectDto[];

  @ApiProperty({ type: [KmlLayerDto] })
  kmlLayers: KmlLayerDto[];
}
