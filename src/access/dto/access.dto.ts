import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';

export class GrantAccessDto {
  @ApiProperty({ example: 2, description: 'ID юзера якому надається доступ' })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ example: 5, description: 'ID проєкту' })
  @IsInt()
  @Type(() => Number)
  projectId: number;
}

export class GrantBatchAccessDto {
  @ApiProperty({ example: 2, description: 'ID юзера' })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ example: [1, 2, 3], description: 'Список ID проєктів' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  projectIds: number[];
}
