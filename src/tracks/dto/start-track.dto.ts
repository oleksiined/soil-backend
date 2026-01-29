import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class StartTrackDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  projectId?: number;
}
