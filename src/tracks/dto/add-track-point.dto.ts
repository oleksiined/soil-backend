import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class AddTrackPointDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  heading?: number;
}
