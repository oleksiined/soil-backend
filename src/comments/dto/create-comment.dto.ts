import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({ example: 50.4867, description: 'Широта точки на карті' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({ example: 28.4915, description: 'Довгота точки на карті' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiProperty({ example: 'Опис проблеми на полі', description: 'Опис проблеми' })
  @IsString()
  @IsNotEmpty()
  problem: string;

  @ApiPropertyOptional({ example: 'GreenLand_65', description: 'Назва поля' })
  @IsString()
  @IsOptional()
  fieldName?: string;

  @ApiPropertyOptional({
    example: 'GreenLand_point.3',
    description: 'ID точки забурювання з KML файлу',
  })
  @IsString()
  @IsOptional()
  kmlPointId?: string;
}
