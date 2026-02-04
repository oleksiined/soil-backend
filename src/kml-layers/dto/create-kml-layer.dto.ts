import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateKmlLayerDto {
  @ApiProperty({ example: 'Field zones' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '<kml>...</kml>' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
