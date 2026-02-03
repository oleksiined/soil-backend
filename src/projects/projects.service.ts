import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
  ) {}

  async createProject(name: string, folderId: number) {
    const project = this.projects.create({
      name,
      folder: { id: folderId },
    });
    return this.projects.save(project);
  }

  async getProjectDetails(projectId: number) {
    return this.projects.findOne({
      where: { id: projectId },
      relations: ['folder', 'kmlLayers'],
    });
  }

  async deleteProjectDeep(id: number) {
    await this.projects.delete(id);
  }
}
