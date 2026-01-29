import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'driver1' })
  username: string;

  @ApiProperty({ example: 'DRIVER' })
  role: string;

  @ApiProperty({ example: false })
  isActive: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
