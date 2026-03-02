import {
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrackPointDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(360)
  heading?: number;

  /**
   * GPS accuracy in meters
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accuracy?: number;

  /**
   * Real device timestamp (ISO string).
   * Example: "2026-03-02T12:34:56.000Z"
   */
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}