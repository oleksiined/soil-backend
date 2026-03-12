import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ZoneSamplingStatus } from '../zone-sampling/entities/zone-sampling-status.entity';
import { Mission } from '../missions/entities/mission.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

export interface StatsRow {
  userId: number;
  username: string;
  projectId: number;
  projectName: string;
  date: string;          // 'YYYY-MM-DD'
  sampledZones: number;  // кількість ефективно підсвічених зон
}

export interface UserStatsSummary {
  userId: number;
  username: string;
  totalSampledZones: number;
  byProject: Array<{
    projectId: number;
    projectName: string;
    sampledZones: number;
  }>;
  byDay: Array<{
    date: string;
    sampledZones: number;
  }>;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(ZoneSamplingStatus)
    private readonly statusRepo: Repository<ZoneSamplingStatus>,

    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  // ─────────────────────────────────────────────
  // Статистика конкретного юзера за період
  // ─────────────────────────────────────────────

  async getUserStats(
    userId: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<UserStatsSummary> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'username'],
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const rows = await this.fetchRows(userId, dateFrom, dateTo);

    return this.buildSummary(user, rows);
  }

  // ─────────────────────────────────────────────
  // Статистика всіх юзерів (тільки Admin)
  // ─────────────────────────────────────────────

  async getAllUsersStats(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<UserStatsSummary[]> {
    const rows = await this.fetchRows(null, dateFrom, dateTo);

    // Групуємо по userId
    const byUser = new Map<number, { username: string; rows: StatsRow[] }>();
    for (const row of rows) {
      if (!byUser.has(row.userId)) {
        byUser.set(row.userId, { username: row.username, rows: [] });
      }
      byUser.get(row.userId)!.rows.push(row);
    }

    const result: UserStatsSummary[] = [];
    for (const [userId, { username, rows: userRows }] of byUser) {
      result.push(
        this.buildSummary({ id: userId, username } as UserEntity, userRows),
      );
    }

    // Сортуємо по totalSampledZones desc
    return result.sort((a, b) => b.totalSampledZones - a.totalSampledZones);
  }

  // ─────────────────────────────────────────────
  // Статистика по конкретному проєкту
  // ─────────────────────────────────────────────

  async getProjectStats(
    projectId: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    projectId: number;
    projectName: string;
    totalSampledZones: number;
    byUser: Array<{ userId: number; username: string; sampledZones: number }>;
    byDay: Array<{ date: string; sampledZones: number }>;
  }> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      select: ['id', 'name'],
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const rows = await this.fetchRows(null, dateFrom, dateTo, projectId);

    // По юзеру
    const byUserMap = new Map<number, { username: string; count: number }>();
    // По дню
    const byDayMap = new Map<string, number>();

    for (const row of rows) {
      // по юзеру
      if (!byUserMap.has(row.userId)) {
        byUserMap.set(row.userId, { username: row.username, count: 0 });
      }
      byUserMap.get(row.userId)!.count += row.sampledZones;

      // по дню
      byDayMap.set(row.date, (byDayMap.get(row.date) ?? 0) + row.sampledZones);
    }

    const totalSampledZones = rows.reduce((s, r) => s + r.sampledZones, 0);

    return {
      projectId,
      projectName: project.name,
      totalSampledZones,
      byUser: [...byUserMap.entries()]
        .map(([userId, { username, count }]) => ({ userId, username, sampledZones: count }))
        .sort((a, b) => b.sampledZones - a.sampledZones),
      byDay: [...byDayMap.entries()]
        .map(([date, sampledZones]) => ({ date, sampledZones }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // ─────────────────────────────────────────────
  // Приватні методи
  // ─────────────────────────────────────────────

  private validateDates(dateFrom?: string, dateTo?: string) {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (dateFrom && !iso.test(dateFrom)) {
      throw new BadRequestException('dateFrom має бути у форматі YYYY-MM-DD');
    }
    if (dateTo && !iso.test(dateTo)) {
      throw new BadRequestException('dateTo має бути у форматі YYYY-MM-DD');
    }
  }

  /**
   * Головний SQL запит — рахує ефективно підсвічені зони
   * (враховує manualOverride пріоритет над автологікою)
   *
   * effectiveSampled = CASE
   *   WHEN manual_override IS NOT NULL THEN manual_override
   *   ELSE is_sampled
   * END
   */
  private async fetchRows(
    userId: number | null,
    dateFrom?: string,
    dateTo?: string,
    projectId?: number,
  ): Promise<StatsRow[]> {
    this.validateDates(dateFrom, dateTo);

    // Дата підсвічування — або override_at або sampled_at
    const params: any[] = [];
    let paramIdx = 1;

    let sql = `
      SELECT
        u.id                                          AS "userId",
        u.username                                    AS "username",
        p.id                                          AS "projectId",
        p.name                                        AS "projectName",
        DATE(
          COALESCE(zss.override_at, zss.sampled_at)
          AT TIME ZONE 'UTC'
        )::text                                       AS "date",
        COUNT(*)::int                                 AS "sampledZones"
      FROM zone_sampling_status zss
      JOIN missions m   ON m.id = zss.mission_id
      JOIN projects p   ON p.id = m.project_id
      JOIN users u      ON u.id = m.user_id
      WHERE
        -- Ефективно підсвічені зони
        CASE
          WHEN zss.manual_override IS NOT NULL THEN zss.manual_override
          ELSE zss.is_sampled
        END = true
        -- Є дата підсвічування
        AND COALESCE(zss.override_at, zss.sampled_at) IS NOT NULL
        -- Місія не в архіві
        AND m."isArchived" = false
    `;

    if (userId !== null) {
      sql += ` AND m.user_id = $${paramIdx++}`;
      params.push(userId);
    }

    if (projectId !== undefined) {
      sql += ` AND p.id = $${paramIdx++}`;
      params.push(projectId);
    }

    if (dateFrom) {
      sql += ` AND COALESCE(zss.override_at, zss.sampled_at) >= $${paramIdx++}::timestamptz`;
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND COALESCE(zss.override_at, zss.sampled_at) < ($${paramIdx++}::date + INTERVAL '1 day')::timestamptz`;
      params.push(dateTo);
    }

    sql += `
      GROUP BY u.id, u.username, p.id, p.name, "date"
      ORDER BY "date" ASC, u.username ASC
    `;

    return this.statusRepo.query(sql, params);
  }

  private buildSummary(user: UserEntity, rows: StatsRow[]): UserStatsSummary {
    const byProjectMap = new Map<number, { name: string; count: number }>();
    const byDayMap = new Map<string, number>();

    for (const row of rows) {
      // по проєкту
      if (!byProjectMap.has(row.projectId)) {
        byProjectMap.set(row.projectId, { name: row.projectName, count: 0 });
      }
      byProjectMap.get(row.projectId)!.count += row.sampledZones;

      // по дню
      byDayMap.set(row.date, (byDayMap.get(row.date) ?? 0) + row.sampledZones);
    }

    const totalSampledZones = rows.reduce((s, r) => s + r.sampledZones, 0);

    return {
      userId: user.id,
      username: user.username,
      totalSampledZones,
      byProject: [...byProjectMap.entries()]
        .map(([projectId, { name, count }]) => ({
          projectId,
          projectName: name,
          sampledZones: count,
        }))
        .sort((a, b) => b.sampledZones - a.sampledZones),
      byDay: [...byDayMap.entries()]
        .map(([date, sampledZones]) => ({ date, sampledZones }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
