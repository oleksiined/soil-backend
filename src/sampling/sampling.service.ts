import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SamplingPoint } from './entities/sampling-point.entity';
import { SampleEvent } from './entities/sample-event.entity';

@Injectable()
export class SamplingService {
  constructor(
    @InjectRepository(SamplingPoint) private readonly points: Repository<SamplingPoint>,
    @InjectRepository(SampleEvent) private readonly events: Repository<SampleEvent>,
  ) {}

  async create(userId: number, dto: any) {
    const p = this.points.create({
      projectId: dto.projectId,
      lat: dto.lat,
      lng: dto.lng,
      title: dto.title ?? null,
      isDone: false,
      doneType: null,
      doneByUserId: null,
      doneAt: null,
    });

    return this.points.save(p);
  }

  async list(projectId: number) {
    return this.points.find({ where: { projectId }, order: { id: 'ASC' } });
  }

  async markDone(userId: number, id: number, doneType: 'AUTO' | 'MANUAL') {
    const p = await this.points.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Sampling point not found');

    p.isDone = true;
    p.doneType = doneType;
    p.doneByUserId = userId;
    p.doneAt = new Date();
    const saved = await this.points.save(p);

    await this.events.save(
      this.events.create({
        userId,
        projectId: p.projectId,
        samplingPointId: p.id,
        eventType: 'DONE',
        doneType,
      }),
    );

    return saved;
  }

  async undo(userId: number, id: number) {
    const p = await this.points.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Sampling point not found');

    p.isDone = false;
    p.doneType = null;
    p.doneByUserId = null;
    p.doneAt = null;
    const saved = await this.points.save(p);

    await this.events.save(
      this.events.create({
        userId,
        projectId: p.projectId,
        samplingPointId: p.id,
        eventType: 'UNDO',
        doneType: null,
      }),
    );

    return saved;
  }
}
