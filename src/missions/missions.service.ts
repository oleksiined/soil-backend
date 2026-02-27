import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Mission } from './entities/mission.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateMissionDto } from './dto/create-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly missions: Repository<Mission>,

    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
  ) {}

  async create(projectId: number, dto: CreateMissionDto) {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const mission = this.missions.create({
      projectId: project.id,
      project,
      name: dto.name,
      status: dto.status ?? 'new',
      isArchived: false,
    });

    return this.missions.save(mission);
  }

  findByProject(projectId: number) {
    return this.missions.find({
      where: { projectId, isArchived: false },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const m = await this.missions.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Mission not found');
    return m;
  }

  async setArchived(id: number, archived: boolean) {
    const m = await this.missions.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Mission not found');

    await this.missions.update(id, { isArchived: archived });
    return { ok: true };
  }

  async delete(id: number) {
    const m = await this.missions.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Mission not found');

    await this.missions.remove(m);
    return { ok: true };
  }
}
