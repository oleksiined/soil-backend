import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class MarkDoneDto {
  @ApiProperty({ enum: ['AUTO', 'MANUAL'] })
  @IsIn(['AUTO', 'MANUAL'])
  doneType: 'AUTO' | 'MANUAL';
}
