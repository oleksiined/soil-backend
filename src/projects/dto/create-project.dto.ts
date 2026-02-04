import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Test project' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
