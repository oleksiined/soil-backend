import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LiveService } from './live.service';

@ApiTags('Live Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('live')
export class LiveController {
  constructor(private readonly service: LiveService) {}

  // ─────────────────────────────────────────────
  // Створити публічне посилання (Admin)
  // ─────────────────────────────────────────────

  @Post('projects/:projectId/share')
  @Roles('ADMIN')
  @ApiOperation({
    summary: '[Admin] Створити публічне посилання для перегляду',
    description:
      'Повертає токен який діє 7 днів. ' +
      'Стороння особа підключається через WebSocket з параметром ?shareToken=<token>',
  })
  createShareToken(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: any,
  ) {
    return this.service.createShareToken(projectId, req.user.sub);
  }

  // ─────────────────────────────────────────────
  // Список активних посилань проєкту (Admin)
  // ─────────────────────────────────────────────

  @Get('projects/:projectId/share')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Список активних публічних посилань' })
  getShareTokens(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getShareTokens(projectId);
  }

  // ─────────────────────────────────────────────
  // Анулювати посилання (Admin)
  // ─────────────────────────────────────────────

  @Delete('share/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Анулювати публічне посилання' })
  revokeShareToken(@Param('id', ParseIntPipe) id: number) {
    return this.service.revokeShareToken(id);
  }

  // ─────────────────────────────────────────────
  // Поточний стан всіх водіїв (Admin — REST fallback)
  // ─────────────────────────────────────────────

  @Get('drivers')
  @Roles('ADMIN')
  @ApiOperation({
    summary: '[Admin] Поточний стан всіх водіїв (REST snapshot)',
    description: 'REST версія snapshot. В реальному часі — WebSocket.',
  })
  getDrivers() {
    return this.service.getAllDrivers();
  }

  // ─────────────────────────────────────────────
  // Водії конкретного проєкту
  // ─────────────────────────────────────────────

  @Get('projects/:projectId/drivers')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Водії конкретного проєкту' })
  getProjectDrivers(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getDriversByProject(projectId);
  }
}
