import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Оновлений опис проблеми' })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({ example: 'GreenLand_65' })
  @IsString()
  @IsOptional()
  fieldName?: string;

  @ApiPropertyOptional({ example: 'GreenLand_point.5' })
  @IsString()
  @IsOptional()
  kmlPointId?: string;
}
