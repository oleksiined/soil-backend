import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  projectId?: number;

  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiProperty()
  @IsString()
  text: string;
}
