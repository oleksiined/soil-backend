import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneSamplingStatus } from './entities/zone-sampling-status.entity';
import { Mission } from '../missions/entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';

@Injectable()
export class ZoneSamplingService {
  private readonly STOP_SPEED = 0.5;
  private readonly STOP_MIN_SECONDS = 5;
  private readonly REQUIRED_STOPS = 15;

  constructor(
    @InjectRepository(ZoneSamplingStatus)
    private readonly statusRepo: Repository<ZoneSamplingStatus>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
    @InjectRepository(TrackPoint)
    private readonly trackRepo: Repository<TrackPoint>,
  ) {}

  // ─────────────────────────────────────────────
  // Автоматична обробка місії (worker)
  // ─────────────────────────────────────────────

  async processMission(missionId: number) {
    const mission = await this.missionRepo.findOne({ where: { id: missionId } });
    if (!mission) return;

    const zones: { id: number }[] = await this.trackRepo.query(
      `
      SELECT id FROM kml_layers
      WHERE project_id = $1
        AND "isArchived" = false
        AND geom IS NOT NULL
      `,
      [mission.projectId],
    );

    for (const zone of zones) {
      await this.processZone(missionId, zone.id);
    }
  }

  // ─────────────────────────────────────────────
  // Статус всіх зон місії
  // ─────────────────────────────────────────────

  async getZoneStatuses(missionId: number): Promise<ZoneSamplingStatus[]> {
    const exists = await this.missionRepo.existsBy({ id: missionId });
    if (!exists) throw new NotFoundException('Mission not found');

    return this.statusRepo.find({
      where: { missionId },
      order: { zoneId: 'ASC' },
    });
  }

  // ─────────────────────────────────────────────
  // Статус однієї зони
  // ─────────────────────────────────────────────

  async getZoneStatus(missionId: number, zoneId: number): Promise<ZoneSamplingStatus> {
    const status = await this.statusRepo.findOne({ where: { missionId, zoneId } });
    if (!status) throw new NotFoundException('Zone status not found');
    return status;
  }

  // ─────────────────────────────────────────────
  // Ручне підтвердження зони
  // ─────────────────────────────────────────────

  async manualConfirm(
    missionId: number,
    zoneId: number,
    userId: number,
    note?: string,
  ): Promise<ZoneSamplingStatus> {
    const status = await this.findOrCreateStatus(missionId, zoneId);

    status.manualOverride = true;
    status.overrideByUserId = userId;
    status.overrideAt = new Date();
    status.overrideNote = note ?? null;

    // Якщо ще не було автоматичного sampledAt — ставимо зараз
    if (!status.sampledAt) {
      status.sampledAt = new Date();
    }

    return this.statusRepo.save(status);
  }

  // ─────────────────────────────────────────────
  // Ручне скасування зони
  // ─────────────────────────────────────────────

  async manualReject(
    missionId: number,
    zoneId: number,
    userId: number,
    note?: string,
  ): Promise<ZoneSamplingStatus> {
    const status = await this.findOrCreateStatus(missionId, zoneId);

    status.manualOverride = false;
    status.overrideByUserId = userId;
    status.overrideAt = new Date();
    status.overrideNote = note ?? null;

    return this.statusRepo.save(status);
  }

  // ─────────────────────────────────────────────
  // Скинути ручне підтвердження (повернутись до автологіки)
  // ─────────────────────────────────────────────

  async resetOverride(
    missionId: number,
    zoneId: number,
  ): Promise<ZoneSamplingStatus> {
    const status = await this.statusRepo.findOne({ where: { missionId, zoneId } });
    if (!status) throw new NotFoundException('Zone status not found');

    status.manualOverride = null;
    status.overrideByUserId = null;
    status.overrideAt = null;
    status.overrideNote = null;

    return this.statusRepo.save(status);
  }

  // ─────────────────────────────────────────────
  // Приватні методи
  // ─────────────────────────────────────────────

  private async findOrCreateStatus(
    missionId: number,
    zoneId: number,
  ): Promise<ZoneSamplingStatus> {
    const missionExists = await this.missionRepo.existsBy({ id: missionId });
    if (!missionExists) throw new NotFoundException('Mission not found');

    // Перевіряємо що зона існує
    const zoneRows: { id: number }[] = await this.trackRepo.query(
      `SELECT id FROM kml_layers WHERE id = $1 AND "isArchived" = false`,
      [zoneId],
    );
    if (!zoneRows.length) throw new NotFoundException('Zone (kml_layer) not found');

    let status = await this.statusRepo.findOne({ where: { missionId, zoneId } });
    if (!status) {
      status = await this.statusRepo.save(
        this.statusRepo.create({ missionId, zoneId }),
      );
    }
    return status;
  }

  private async processZone(missionId: number, zoneId: number) {
    let status = await this.statusRepo.findOne({ where: { missionId, zoneId } });

    if (!status) {
      status = await this.statusRepo.save(
        this.statusRepo.create({ missionId, zoneId }),
      );
    }

    // Якщо вже є ручне підтвердження — автологіку не зупиняємо,
    // але isSampled все одно оновлюємо для точної статистики
    const points = await this.trackRepo.query(
      `
      SELECT id, "createdAt", speed
      FROM track_points
      WHERE mission_id = $1
        AND id > $2
        AND geom IS NOT NULL
        AND ST_Contains(
              (SELECT geom FROM kml_layers WHERE id = $3),
              geom
            )
      ORDER BY id ASC
      `,
      [missionId, status.lastPointId, zoneId],
    );

    if (!points.length) return;

    let stops = status.stopsCount;
    let inStop = status.inStop;
    let stopStart: Date | null = status.stopStartAt;

    for (const p of points) {
      const time = new Date(p.createdAt);
      const speed = Number(p.speed ?? 9999);

      if (speed <= this.STOP_SPEED) {
        if (!inStop) {
          inStop = true;
          stopStart = time;
        }
      } else {
        if (inStop && stopStart) {
          const duration = (time.getTime() - stopStart.getTime()) / 1000;
          if (duration >= this.STOP_MIN_SECONDS) stops++;
        }
        inStop = false;
        stopStart = null;
      }
    }

    status.lastPointId = points[points.length - 1].id;
    status.stopsCount = stops;
    status.inStop = inStop;
    status.stopStartAt = stopStart;

    if (!status.isSampled && stops >= this.REQUIRED_STOPS) {
      status.isSampled = true;
      status.sampledAt = new Date();
    }

    await this.statusRepo.save(status);
  }
}
