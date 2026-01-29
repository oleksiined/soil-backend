import { ApiProperty } from '@nestjs/swagger';

export class SetActiveDto {
  @ApiProperty()
  isActive: boolean;
}
