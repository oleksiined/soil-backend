import { ApiProperty } from '@nestjs/swagger';

export class KmlLayerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  fileUrl: string;
}
