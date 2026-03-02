import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrackPoint } from './entities/track-point.entity';
import { Mission } from '../missions/entities/mission.entity';
import { CreateTrackPointDto } from './dto/create-track-point.dto';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(TrackPoint)
    private readonly pointsRepo: Repository<TrackPoint>,

    @InjectRepository(Mission)
    private readonly missionsRepo: Repository<Mission>,
  ) {}

  /**
   * Add single GPS point
   */
  async addPoint(missionId: number, dto: CreateTrackPointDto) {
    const missionExists = await this.missionsRepo.exist({
      where: { id: missionId },
    });

    if (!missionExists) {
      throw new NotFoundException('Mission not found');
    }

    const point = this.pointsRepo.create({
      missionId,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed ?? null,
      heading: dto.heading ?? null,
      accuracy: dto.accuracy ?? null,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });

    return this.pointsRepo.save(point);
  }

  /**
   * Add batch of GPS points (optimized for field mode)
   */
  async addBatch(missionId: number, points: CreateTrackPointDto[]) {
    if (!points.length) {
      return { inserted: 0 };
    }

    const missionExists = await this.missionsRepo.exist({
      where: { id: missionId },
    });

    if (!missionExists) {
      throw new NotFoundException('Mission not found');
    }

    const entities = points.map((dto) =>
      this.pointsRepo.create({
        missionId,
        lat: dto.lat,
        lng: dto.lng,
        speed: dto.speed ?? null,
        heading: dto.heading ?? null,
        accuracy: dto.accuracy ?? null,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      }),
    );

    await this.pointsRepo.save(entities);

    return {
      inserted: entities.length,
    };
  }

  /**
   * Get all points of mission ordered by timestamp
   */
  async getByMission(missionId: number) {
    return this.pointsRepo.find({
      where: { missionId },
      order: {
        timestamp: 'ASC',
        id: 'ASC',
      },
    });
  }

  /**
   * Delete all points of mission
   */
  async deleteByMission(missionId: number) {
    await this.pointsRepo.delete({ missionId });

    return { ok: true };
  }
}