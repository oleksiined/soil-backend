import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: ['ADMIN', 'DRIVER'], required: false })
  role?: 'ADMIN' | 'DRIVER';
}
