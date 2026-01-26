import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Folder } from '../folders/entities/folder.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projects: Repository<Project>,
    @InjectRepository(Folder) private folders: Repository<Folder>,
  ) {}

  async create(dto: CreateProjectDto) {
    const folder = await this.folders.findOneBy({ id: dto.folderId });
    if (!folder) throw new BadRequestException('Folder not found');

    const project = this.projects.create({
      name: dto.name,
      folderId: dto.folderId,
    });

    return this.projects.save(project);
  }

  findAll() {
    return this.projects.find({ relations: { folder: true } });
  }

  findOne(id: number) {
    return this.projects.findOne({ where: { id }, relations: { folder: true } });
  }
}
