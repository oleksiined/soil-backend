import { ApiProperty } from '@nestjs/swagger';
import { ProjectDto } from './project.dto';
import { KmlLayerDto } from './kml-layer.dto';

export class SyncV2Dto {
  @ApiProperty({ example: '2026-01-28T18:00:00.000Z' })
  serverTime: string;

  @ApiProperty({ type: [ProjectDto] })
  projects: ProjectDto[];

  @ApiProperty({ type: [KmlLayerDto] })
  kmlLayers: KmlLayerDto[];
}
