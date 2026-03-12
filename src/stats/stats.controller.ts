import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  // ─────────────────────────────────────────────
  // Моя статистика (будь-який юзер)
  // ─────────────────────────────────────────────

  @Get('me')
  @ApiOperation({
    summary: 'Моя статистика зразків',
    description: 'Кількість підсвічених зон за період, по проєктах і по днях.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01', description: 'Від дати (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31', description: 'До дати (YYYY-MM-DD)' })
  getMyStats(
    @Request() req: any,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.service.getUserStats(req.user.sub, dateFrom, dateTo);
  }

  // ─────────────────────────────────────────────
  // Статистика конкретного юзера (Admin або сам юзер)
  // ─────────────────────────────────────────────

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Статистика конкретного юзера',
    description: 'Admin бачить будь-якого. User бачить тільки свою.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  getUserStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: any,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    // User може дивитись тільки свою статистику
    if (req.user.role !== 'ADMIN' && req.user.sub !== userId) {
      throw new ForbiddenException('You can only view your own statistics');
    }
    return this.service.getUserStats(userId, dateFrom, dateTo);
  }

  // ─────────────────────────────────────────────
  // Статистика всіх юзерів (тільки Admin)
  // ─────────────────────────────────────────────

  @Get('all-users')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: '[Admin] Статистика всіх юзерів',
    description: 'Зведена таблиця по всіх юзерах, відсортована по кількості зон.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  getAllStats(
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.service.getAllUsersStats(dateFrom, dateTo);
  }

  // ─────────────────────────────────────────────
  // Статистика по проєкту (Admin або юзер з доступом)
  // ─────────────────────────────────────────────

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Статистика по проєкту',
    description: 'Скільки зон відібрано в проєкті — по юзерах і по днях.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  getProjectStats(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.service.getProjectStats(projectId, dateFrom, dateTo);
  }
}
