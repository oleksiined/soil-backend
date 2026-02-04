import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
    const folder = await this.folders.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');

    try {
      const project = this.projects.create({
        name: dto.name,
        isArchived: false,
        folder,
      });

      return await this.projects.save(project);
    } catch {
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async getByFolder(folderId: number): Promise<ProjectEntity[]> {
    return this.projects.find({
      where: { folder: { id: folderId } },
      order: { id: 'ASC' },
    });
  }

  async getById(id: number): Promise<ProjectEntity> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async delete(id: number): Promise<{ ok: true }> {
    await this.projects.delete(id);
    return { ok: true };
  }
}
