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
      name: dto.name,
      status: dto.status ?? 'new',
      isArchived: false,
      project,
    });

    return this.missions.save(mission);
  }

  findByProject(projectId: number) {
    return this.missions.find({
      where: {
        project: { id: projectId },
        isArchived: false,
      },
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.missions.findOne({
      where: { id },
      relations: { project: true },
    });
  }

  async setArchived(id: number, archived: boolean) {
    const mission = await this.missions.findOne({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');

    await this.missions.update(id, { isArchived: archived });
    return { ok: true };
  }

  async delete(id: number) {
    const mission = await this.missions.findOne({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');

    await this.missions.remove(mission);
    return { ok: true };
  }
}
