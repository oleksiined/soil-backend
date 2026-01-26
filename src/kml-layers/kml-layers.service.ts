import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmlLayer, KmlLayerType } from './entities/kml-layer.entity';
import { Project } from '../projects/entities/project.entity';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_TYPES: KmlLayerType[] = ['tracks', 'points', 'centroid', 'zones'];

@Injectable()
export class KmlLayersService {
  constructor(
    @InjectRepository(KmlLayer) private layers: Repository<KmlLayer>,
    @InjectRepository(Project) private projects: Repository<Project>,
  ) {}

  async upload(args: { projectId: number; type: string; file: Express.Multer.File }) {
    const type = args.type as KmlLayerType;
    if (!ALLOWED_TYPES.includes(type)) {
      throw new BadRequestException(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
    }

    const project = await this.projects.findOneBy({ id: args.projectId });
    if (!project) throw new BadRequestException('Project not found');

    const ext = path.extname(args.file.originalname).toLowerCase();
    if (ext !== '.kml') throw new BadRequestException('Only .kml files allowed');

    const dir = path.join(process.cwd(), 'uploads', 'kml', String(args.projectId));
    fs.mkdirSync(dir, { recursive: true });

    const safeBase = args.file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9\u0400-\u04FF _.-]/g, '')
      .slice(0, 50);

    const filename = `${type}_${Date.now()}_${safeBase || 'layer'}.kml`;
    const fullPath = path.join(dir, filename);

    fs.writeFileSync(fullPath, args.file.buffer);

    const row = this.layers.create({
      projectId: args.projectId,
      type,
      originalName: args.file.originalname,
      path: fullPath,
    });

    return this.layers.save(row);
  }

  findAll() {
    return this.layers.find();
  }

  findOne(id: number) {
    return this.layers.findOne({ where: { id } });
  }
}
