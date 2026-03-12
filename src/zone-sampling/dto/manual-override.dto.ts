import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ManualOverrideDto {
  @ApiPropertyOptional({
    example: 'Зону відібрано, але GPS не зафіксував всі точки',
    description: 'Необов\'язковий коментар до ручної зміни',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
