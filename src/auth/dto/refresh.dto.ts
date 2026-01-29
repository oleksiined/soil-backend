import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ required: false })
  deviceId?: string;
}
