import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;
}
