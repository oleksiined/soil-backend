import { ApiProperty } from '@nestjs/swagger';
import { ProjectDto } from '../../projects/dto/project.dto';

export class FolderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty({ type: () => [ProjectDto] })
  projects: ProjectDto[];
}
