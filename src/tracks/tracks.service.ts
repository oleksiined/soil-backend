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

  async addPoint(missionId: number, dto: CreateTrackPointDto) {
    const mission = await this.missionsRepo.findOne({
      where: { id: missionId },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    const point = this.pointsRepo.create({
      mission,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed,
      heading: dto.heading,
      geom: {
        type: 'Point',
        coordinates: [dto.lng, dto.lat],
      } as any,
    });

    return this.pointsRepo.save(point);
  }

  async addBatch(missionId: number, dtos: CreateTrackPointDto[]) {
    const mission = await this.missionsRepo.findOne({
      where: { id: missionId },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    const points = dtos.map((dto) =>
      this.pointsRepo.create({
        mission,
        lat: dto.lat,
        lng: dto.lng,
        speed: dto.speed,
        heading: dto.heading,
        geom: {
          type: 'Point',
          coordinates: [dto.lng, dto.lat],
        } as any,
      }),
    );

    return this.pointsRepo.save(points);
  }

  async getByMission(missionId: number) {
    return this.pointsRepo.find({
      where: {
        mission: { id: missionId },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async deleteByMission(missionId: number) {
    await this.pointsRepo.delete({
      mission: { id: missionId } as any,
    });

    return { ok: true };
  }
}