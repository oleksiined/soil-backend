import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'SamplayerAdmin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Samplayer2026*' })
  @IsString()
  password: string;
}
