import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KmlLayerEntity } from './entities/kml-layer.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateKmlLayerDto } from './dto/create-kml-layer.dto';

@Injectable()
export class KmlLayersService {
  constructor(
    @InjectRepository(KmlLayerEntity)
    private readonly layers: Repository<KmlLayerEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
  ) {}

  async create(
    projectId: number,
    dto: CreateKmlLayerDto,
  ): Promise<KmlLayerEntity> {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const layer = this.layers.create({
      name: dto.name,
      content: dto.content,
      isArchived: false,
      project,
    });

    return this.layers.save(layer);
  }

  async getByProject(projectId: number): Promise<KmlLayerEntity[]> {
    return this.layers.find({
      where: {
        project: { id: projectId },
        isArchived: false,
      },
      order: { id: 'ASC' },
    });
  }

  async setArchived(id: number, archived: boolean): Promise<{ ok: true }> {
    const layer = await this.layers.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    await this.layers.update(id, { isArchived: archived });
    return { ok: true };
  }

  async delete(id: number): Promise<{ ok: true }> {
    const layer = await this.layers.findOne({ where: { id } });
    if (!layer) return { ok: true };

    await this.layers.remove(layer);
    return { ok: true };
  }
}
