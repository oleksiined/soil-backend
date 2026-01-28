import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  folderId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  created_at: string;
}
