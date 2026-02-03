import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmlLayerEntity } from './entities/kml-layer.entity';

@Injectable()
export class KmlLayersService {
  constructor(
    @InjectRepository(KmlLayerEntity)
    private readonly layers: Repository<KmlLayerEntity>,
  ) {}

  async create(name: string, content: string, projectId: number) {
    const layer = this.layers.create({
      name,
      content,
      project: { id: projectId },
    });
    return this.layers.save(layer);
  }

  async getByProject(projectId: number) {
    return this.layers.find({
      where: { project: { id: projectId } },
    });
  }

  async delete(id: number) {
    await this.layers.delete(id);
  }
}
