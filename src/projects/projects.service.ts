import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from './entities/project.entity';
import { FolderEntity } from '../folders/entities/folder.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,

    @InjectRepository(FolderEntity)
    private readonly folders: Repository<FolderEntity>,
  ) {}

  async create(folderId: number, name: string) {
    const folder = await this.folders.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const project = this.projects.create({
      name,
      folder,
      isArchived: false,
    });

    return this.projects.save(project);
  }

  async findByFolder(folderId: number) {
    return this.projects.find({
      where: {
        folder: { id: folderId },
        isArchived: false,
      },
      relations: ['missions', 'kmlLayers'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const project = await this.projects.findOne({
      where: { id },
      relations: ['missions', 'kmlLayers'],
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async archive(id: number) {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    project.isArchived = true;
    await this.projects.save(project);

    return { ok: true };
  }

  async unarchive(id: number) {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    project.isArchived = false;
    await this.projects.save(project);

    return { ok: true };
  }

  async delete(id: number) {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    await this.projects.remove(project);
    return { ok: true };
  }
}
