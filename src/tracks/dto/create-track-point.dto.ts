import { IsNumber } from 'class-validator';

export class CreateTrackPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  speed: number;

  @IsNumber()
  heading: number;
}