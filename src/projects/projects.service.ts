import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from './entities/project.entity';
import { FolderEntity } from '../folders/entities/folder.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(FolderEntity)
    private readonly folders: Repository<FolderEntity>,
  ) {}

  async create(folderId: number, dto: CreateProjectDto): Promise<ProjectEntity> {
    const folder = await this.folders.findOne({
      where: { id: folderId } as any,
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    try {
      const project: ProjectEntity = this.projects.create({
        name: dto.name,
        isArchived: false,
        folder,
      } as ProjectEntity);

      return await this.projects.save(project);
    } catch {
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async getById(id: number): Promise<ProjectEntity> {
    const project = await this.projects.findOne({
      where: { id } as any,
      relations: { folder: true } as any,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async delete(id: number): Promise<{ ok: true }> {
    const project = await this.projects.findOne({
      where: { id } as any,
    });

    if (!project) {
      return { ok: true };
    }

    try {
      await this.projects.remove(project);
      return { ok: true };
    } catch {
      throw new InternalServerErrorException('Failed to delete project');
    }
  }
}
