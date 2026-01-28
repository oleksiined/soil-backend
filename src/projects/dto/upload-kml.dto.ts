import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadKmlDto {
  @ApiPropertyOptional({ enum: ['track', 'points', 'centroid', 'zones'] })
  @IsOptional()
  @IsString()
  @IsIn(['track', 'points', 'centroid', 'zones'])
  type?: string;
}
