import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Track } from './entities/track.entity';
import { TrackPoint } from './entities/track-point.entity';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track) private readonly tracks: Repository<Track>,
    @InjectRepository(TrackPoint) private readonly points: Repository<TrackPoint>,
  ) {}

  async start(userId: number, projectId?: number) {
    // зупиняємо активні треки цього юзера (без фанатизму)
    const active = await this.tracks.find({ where: { userId, isActive: true } });
    for (const t of active) {
      t.isActive = false;
      t.stopped_at = new Date();
    }
    if (active.length) await this.tracks.save(active);

    const track = this.tracks.create({
      userId,
      projectId: projectId ?? null,
      isActive: true,
      started_at: new Date(),
      stopped_at: null,
    });

    const saved = await this.tracks.save(track);
    return saved;
  }

  async addPoint(userId: number, trackId: number, dto: any) {
    const track = await this.tracks.findOne({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Track not found');
    if (track.userId !== userId) throw new NotFoundException('Track not found');
    if (!track.isActive) throw new BadRequestException('Track is not active');

    const p = this.points.create({
      trackId,
      lat: Number(dto.lat),
      lng: Number(dto.lng),
      accuracy: dto.accuracy ?? null,
      speed: dto.speed ?? null,
      heading: dto.heading ?? null,
    });

    return this.points.save(p);
  }

  async stop(userId: number, trackId: number) {
    const track = await this.tracks.findOne({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Track not found');
    if (track.userId !== userId) throw new NotFoundException('Track not found');

    track.isActive = false;
    track.stopped_at = new Date();
    return this.tracks.save(track);
  }

  async getTrack(userId: number, id: number) {
    const track = await this.tracks.findOne({ where: { id } });
    if (!track || track.userId !== userId) throw new NotFoundException('Track not found');

    const pts = await this.points.find({ where: { trackId: id }, order: { id: 'ASC' } });
    return { ...track, points: pts };
  }

  async list(userId: number, date?: string) {
    // date = YYYY-MM-DD, фільтр по started_at в рамках доби
    let items = await this.tracks.find({ where: { userId }, order: { id: 'DESC' } });

    if (date) {
      const d = new Date(`${date}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) {
        const start = d.getTime();
        const end = start + 24 * 60 * 60 * 1000;
        items = items.filter((t) => {
          const ts = new Date(t.started_at).getTime();
          return ts >= start && ts < end;
        });
      }
    }

    return items;
  }
}
