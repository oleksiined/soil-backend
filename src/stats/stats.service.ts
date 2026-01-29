import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SampleEvent } from '../sampling/entities/sample-event.entity';

@Injectable()
export class StatsService {
  constructor(@InjectRepository(SampleEvent) private readonly events: Repository<SampleEvent>) {}

  async daily(userId: number, date: string) {
    const d = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return { date, done: 0 };

    const start = d.getTime();
    const end = start + 24 * 60 * 60 * 1000;

    const all = await this.events.find({ where: { userId } });
    const done = all.filter((e) => {
      const ts = new Date(e.created_at).getTime();
      return e.eventType === 'DONE' && ts >= start && ts < end;
    }).length;

    return { date, userId, done };
  }

  async season(userId: number, year: number) {
    const start = new Date(`${year}-01-01T00:00:00.000Z`).getTime();
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`).getTime();

    const all = await this.events.find({ where: { userId } });
    const done = all.filter((e) => {
      const ts = new Date(e.created_at).getTime();
      return e.eventType === 'DONE' && ts >= start && ts < end;
    }).length;

    return { year, userId, done };
  }
}
