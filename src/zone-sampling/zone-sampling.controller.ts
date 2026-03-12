import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { ZoneSamplingService } from './zone-sampling.service';
import { ManualOverrideDto } from './dto/manual-override.dto';

@ApiTags('Zone Sampling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('missions/:missionId/zones')
export class ZoneSamplingController {
  constructor(private readonly service: ZoneSamplingService) {}

  // ─────────────────────────────────────────────
  // Статус всіх зон місії
  // ─────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Статус всіх зон місії',
    description:
      'Повертає список зон з автоматичним та ручним статусом. ' +
      'Поле effectiveSampled = фінальний статус (враховує ручне підтвердження).',
  })
  getAll(@Param('missionId', ParseIntPipe) missionId: number) {
    return this.service.getZoneStatuses(missionId);
  }

  // ─────────────────────────────────────────────
  // Статус однієї зони
  // ─────────────────────────────────────────────

  @Get(':zoneId')
  @ApiOperation({ summary: 'Статус конкретної зони' })
  getOne(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Param('zoneId', ParseIntPipe) zoneId: number,
  ) {
    return this.service.getZoneStatus(missionId, zoneId);
  }

  // ─────────────────────────────────────────────
  // Ручне ПІДТВЕРДЖЕННЯ зони
  // ─────────────────────────────────────────────

  @Post(':zoneId/confirm')
  @ApiOperation({
    summary: 'Вручну підтвердити відбір зони',
    description:
      'Встановлює manualOverride = true. ' +
      'Зона буде підсвічена навіть якщо автологіка ще не спрацювала.',
  })
  confirm(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Param('zoneId', ParseIntPipe) zoneId: number,
    @Body() dto: ManualOverrideDto,
    @Request() req: any,
  ) {
    return this.service.manualConfirm(missionId, zoneId, req.user.sub, dto.note);
  }

  // ─────────────────────────────────────────────
  // Ручне СКАСУВАННЯ зони
  // ─────────────────────────────────────────────

  @Post(':zoneId/reject')
  @ApiOperation({
    summary: 'Вручну скасувати підсвічування зони',
    description:
      'Встановлює manualOverride = false. ' +
      'Зона НЕ буде підсвічена навіть якщо автологіка вже спрацювала.',
  })
  reject(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Param('zoneId', ParseIntPipe) zoneId: number,
    @Body() dto: ManualOverrideDto,
    @Request() req: any,
  ) {
    return this.service.manualReject(missionId, zoneId, req.user.sub, dto.note);
  }

  // ─────────────────────────────────────────────
  // Скинути ручне підтвердження (повернутись до автологіки)
  // ─────────────────────────────────────────────

  @Delete(':zoneId/override')
  @ApiOperation({
    summary: 'Скинути ручне підтвердження',
    description:
      'Видаляє manualOverride. Зона повертається до автоматичного статусу.',
  })
  resetOverride(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Param('zoneId', ParseIntPipe) zoneId: number,
  ) {
    return this.service.resetOverride(missionId, zoneId);
  }
}
