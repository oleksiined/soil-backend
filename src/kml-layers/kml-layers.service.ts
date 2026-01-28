import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { KmlLayer } from '../projects/entities/kml-layer.entity';

@Injectable()
export class KmlLayersService {
  constructor(@InjectRepository(KmlLayer) private readonly repo: Repository<KmlLayer>) {}

  async setArchived(id: number, isArchived: boolean) {
    const layer = await this.repo.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    layer.isArchived = isArchived;
    await this.repo.save(layer);

    return { ok: true };
  }

  async deleteOne(id: number) {
    const layer = await this.repo.findOne({ where: { id } });
    if (!layer) throw new NotFoundException('KML layer not found');

    const storedPath = layer.path || '';
    await this.repo.remove(layer);

    if (storedPath) {
      const abs = path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath);
      try {
        await fs.unlink(abs);
      } catch {}
    }

    return { ok: true };
  }
}
