import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty()
  password: string;
}
