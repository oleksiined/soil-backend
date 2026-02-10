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
      project,
    });

    return this.missions.save(mission);
  }

  findByProject(projectId: number) {
    return this.missions.find({
      where: { project: { id: projectId } },
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.missions.findOneBy({ id });
  }
}
