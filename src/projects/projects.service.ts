import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private repo: Repository<Project>) {}

  create(dto: CreateProjectDto) {
    if (!dto?.name) throw new BadRequestException('name is required');
    if (!dto?.folderId) throw new BadRequestException('folderId is required');
    return this.repo.save(this.repo.create(dto));
  }

  // ✅ за замовчуванням показуємо тільки НЕархівні
  findAll(includeArchived = false) {
    if (includeArchived) return this.repo.find();
    return this.repo.find({ where: { isArchived: false } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.repo.update({ id }, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found');
    await this.repo.delete({ id });
    return { deleted: true, id };
  }

  async archive(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found');
    await this.repo.update({ id }, { isArchived: true });
    return { archived: true, id };
  }

  async unarchive(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found');
    await this.repo.update({ id }, { isArchived: false });
    return { archived: false, id };
  }

  // ✅ забрати KML шари для проєкту
  async getKmlLayers(projectId: number) {
    return this.repo.findOne({
      where: { id: projectId },
      relations: { kmlLayers: true },
    });
  }
}
