import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMissionDto {
  @ApiProperty({ example: 'Test mission' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'new', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
