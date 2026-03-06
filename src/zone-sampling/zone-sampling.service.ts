import { Injectable } from '@nestjs/common';
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

  private async processZone(missionId: number, zoneId: number) {
    let status = await this.statusRepo.findOne({ where: { missionId, zoneId } });

    if (!status) {
      status = await this.statusRepo.save(
        this.statusRepo.create({
          missionId,
          zoneId,
        }),
      );
    }

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
          const duration =
            (time.getTime() - stopStart.getTime()) / 1000;
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