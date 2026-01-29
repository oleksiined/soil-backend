import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSamplingPointDto {
  @ApiProperty()
  @IsInt()
  projectId: number;

  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  title?: string;
}
