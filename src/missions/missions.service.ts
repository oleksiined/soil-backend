import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Mission } from './entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';
import { MissionSummaryDto } from './dto/mission-summary.dto';
import { MissionRouteGeoJsonDto } from './dto/mission-route-geojson.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly missionsRepo: Repository<Mission>,

    @InjectRepository(TrackPoint)
    private readonly trackRepo: Repository<TrackPoint>,
  ) {}

  async getSummary(missionId: number): Promise<MissionSummaryDto> {
    const missionExists = await this.missionsRepo.exist({
      where: { id: missionId },
    });

    if (!missionExists) {
      throw new NotFoundException('Mission not found');
    }

    const statsRaw = await this.trackRepo
      .createQueryBuilder('t')
      .select('COUNT(t.id)', 'count')
      .addSelect('MIN(t.timestamp)', 'minTime')
      .addSelect('MAX(t.timestamp)', 'maxTime')
      .where('t.mission_id = :missionId', { missionId })
      .andWhere('t.timestamp IS NOT NULL')
      .getRawOne<{
        count: string;
        minTime: Date | null;
        maxTime: Date | null;
      }>();

    const stats = statsRaw ?? {
      count: '0',
      minTime: null,
      maxTime: null,
    };

    const pointsCount = Number(stats.count);

    if (
      pointsCount < 2 ||
      stats.minTime === null ||
      stats.maxTime === null
    ) {
      return {
        missionId,
        distanceMeters: 0,
        durationSeconds: 0,
        averageSpeedMps: 0,
        pointsCount,
      };
    }

    const points = await this.trackRepo
      .createQueryBuilder('t')
      .select(['t.lat', 't.lng'])
      .where('t.mission_id = :missionId', { missionId })
      .andWhere('t.timestamp IS NOT NULL')
      .orderBy('t.timestamp', 'ASC')
      .getRawMany<{ t_lat: number; t_lng: number }>();

    let distance = 0;

    for (let i = 1; i < points.length; i++) {
      distance += this.haversine(
        points[i - 1].t_lat,
        points[i - 1].t_lng,
        points[i].t_lat,
        points[i].t_lng,
      );
    }

    const durationSeconds =
      (new Date(stats.maxTime).getTime() -
        new Date(stats.minTime).getTime()) /
      1000;

    const averageSpeedMps =
      durationSeconds > 0 ? distance / durationSeconds : 0;

    return {
      missionId,
      distanceMeters: Number(distance.toFixed(2)),
      durationSeconds: Math.round(durationSeconds),
      averageSpeedMps: Number(averageSpeedMps.toFixed(3)),
      pointsCount,
    };
  }

  async getRouteGeoJson(
    missionId: number,
  ): Promise<MissionRouteGeoJsonDto> {
    const missionExists = await this.missionsRepo.exist({
      where: { id: missionId },
    });

    if (!missionExists) {
      throw new NotFoundException('Mission not found');
    }

    const points = await this.trackRepo
      .createQueryBuilder('t')
      .select(['t.lat', 't.lng'])
      .where('t.mission_id = :missionId', { missionId })
      .andWhere('t.timestamp IS NOT NULL')
      .orderBy('t.timestamp', 'ASC')
      .getRawMany<{ t_lat: number; t_lng: number }>();

    const coordinates = points.map((p) => [p.t_lng, p.t_lat]);

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        missionId,
        pointsCount: points.length,
      },
    };
  }

  private haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}