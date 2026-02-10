import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './entities/mission.entity';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ProjectEntity } from '../projects/entities/project.entity';

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
      projectId,
      project,
      name: dto.name,
      status: 'new',
    });

    return this.missions.save(mission);
  }

  findByProject(projectId: number) {
    return this.missions.find({
      where: { projectId },
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.missions.findOne({ where: { id } });
  }
}
