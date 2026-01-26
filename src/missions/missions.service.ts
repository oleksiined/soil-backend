import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from '../entities/mission.entity';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly repo: Repository<Mission>,
  ) {}

  create(body: { name?: string }) {
    return this.repo.save(
      this.repo.create({ name: body?.name ?? null, status: 'new' }),
    );
  }

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }
}
