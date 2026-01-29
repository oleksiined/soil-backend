import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @ApiOkResponse({ schema: { example: { date: '2026-01-29', userId: 1, done: 5 } } })
  @Get('daily')
  daily(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.daily(user.id, String(date || ''));
  }

  @ApiOkResponse({ schema: { example: { year: 2026, userId: 1, done: 120 } } })
  @Get('season')
  season(@CurrentUser() user: any, @Query('year') year: string) {
    const y = Number(year);
    return this.service.season(user.id, Number.isFinite(y) ? y : new Date().getUTCFullYear());
  }
}
