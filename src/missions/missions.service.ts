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

  async findByProject(projectId: number, page = 1, limit = 10) {
    const [items, total] = await this.missions.findAndCount({
      where: {
        project: { id: projectId },
        isArchived: false,
      },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async setArchived(id: number, value: boolean) {
    const mission = await this.missions.findOne({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');

    mission.isArchived = value;
    return this.missions.save(mission);
  }

  async findOne(id: number) {
    return this.missions.findOne({
      where: { id, isArchived: false },
    });
  }
}
