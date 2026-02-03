import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({
    example: 'My first folder',
    description: 'Folder name',
  })
  @IsString()
  @MinLength(1)
  name: string;
}
