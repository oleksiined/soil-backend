import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

import { KmlLayer } from '../projects/entities/kml-layer.entity';

@Injectable()
export class KmlLayersService {
  constructor(
    @InjectRepository(KmlLayer)
    private readonly kmlRepo: Repository<KmlLayer>,
  ) {}

  async setArchived(id: number, isArchived: boolean) {
    const layer = await this.kmlRepo.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    layer.isArchived = isArchived;
    return this.kmlRepo.save(layer);
  }

  async deleteLayer(id: number) {
    const layer = await this.kmlRepo.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    const storedPath = layer.path || '';
    if (storedPath) {
      const abs = path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath);
      try {
        await fs.unlink(abs);
      } catch {}
    }

    await this.kmlRepo.remove(layer);
  }

  async getLayerFile(id: number) {
    const layer = await this.kmlRepo.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    const storedPath = layer.path || '';
    if (!storedPath) throw new NotFoundException('KML file not found');

    const abs = path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath);
    return { absPath: abs, filename: layer.originalName || `kml-layer-${id}.kml` };
  }
}
