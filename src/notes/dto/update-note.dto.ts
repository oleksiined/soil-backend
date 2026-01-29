import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  text?: string;
}
