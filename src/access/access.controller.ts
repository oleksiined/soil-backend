import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AccessService } from './access.service';
import { GrantAccessDto, GrantBatchAccessDto } from './dto/access.dto';

@ApiTags('Access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('access')
export class AccessController {
  constructor(private readonly service: AccessService) {}

  // ─────────────────────────────────────────────
  // Надати доступ до одного проєкту
  // ─────────────────────────────────────────────

  @Post('grant')
  @ApiOperation({ summary: '[Admin] Надати юзеру доступ до проєкту' })
  grant(@Body() dto: GrantAccessDto) {
    return this.service.grantAccess(dto.userId, dto.projectId, 0);
  }

  // ─────────────────────────────────────────────
  // Надати доступ до кількох проєктів одразу
  // ─────────────────────────────────────────────

  @Post('grant-batch')
  @ApiOperation({ summary: '[Admin] Надати юзеру доступ до кількох проєктів' })
  grantBatch(@Body() dto: GrantBatchAccessDto) {
    return this.service.grantBatch(dto.userId, dto.projectIds, 0);
  }

  // ─────────────────────────────────────────────
  // Забрати доступ до проєкту
  // ─────────────────────────────────────────────

  @Delete('revoke/user/:userId/project/:projectId')
  @ApiOperation({ summary: '[Admin] Забрати доступ юзера до проєкту' })
  revoke(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.service.revokeAccess(userId, projectId);
  }

  // ─────────────────────────────────────────────
  // Забрати всі доступи юзера
  // ─────────────────────────────────────────────

  @Delete('revoke/user/:userId/all')
  @ApiOperation({ summary: '[Admin] Забрати всі доступи юзера' })
  revokeAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.revokeAll(userId);
  }

  // ─────────────────────────────────────────────
  // Список проєктів юзера
  // ─────────────────────────────────────────────

  @Get('user/:userId/projects')
  @ApiOperation({ summary: '[Admin] Які проєкти доступні юзеру' })
  getProjectsForUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getProjectsForUser(userId);
  }

  // ─────────────────────────────────────────────
  // Список юзерів з доступом до проєкту
  // ─────────────────────────────────────────────

  @Get('project/:projectId/users')
  @ApiOperation({ summary: '[Admin] Які юзери мають доступ до проєкту' })
  getUsersForProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getUsersForProject(projectId);
  }
}
