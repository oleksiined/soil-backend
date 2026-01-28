import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

import { Project } from './entities/project.entity';
import { KmlLayer, KmlType } from './entities/kml-layer.entity';

function normalizeType(v?: string): KmlType {
  const t = String(v || '').toLowerCase().trim();
  if (t === 'track' || t === 'centroid' || t === 'points' || t === 'zones') return t;
  return 'track';
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(KmlLayer) private readonly kmlRepo: Repository<KmlLayer>,
  ) {}

  async createProject(folderId: number, name: string) {
    const project = this.projectRepo.create({ folderId, name: String(name || '').trim() });
    return this.projectRepo.save(project);
  }

  async getProjectKmlLayers(projectId: number) {
    return this.kmlRepo.find({
      where: { projectId },
      order: { id: 'ASC' },
    });
  }

  async uploadProjectKml(projectId: number, typeRaw?: string, file?: Express.Multer.File) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    if (!file) throw new BadRequestException('File is missing (field name must be "file")');

    const type = normalizeType(typeRaw);
    const relPath = path.join('uploads', 'kml', file.filename);

    const layer = this.kmlRepo.create({
      projectId,
      type,
      originalName: file.originalname,
      path: relPath,
      isArchived: false,
    });

    return this.kmlRepo.save(layer);
  }

  async setArchived(id: number, isArchived: boolean) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    project.isArchived = isArchived;
    return this.projectRepo.save(project);
  }

  async deleteProjectDeep(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const layers = await this.kmlRepo.find({ where: { projectId } });
    for (const l of layers) {
      const storedPath = l.path || '';
      if (!storedPath) continue;

      const abs = path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath);
      try {
        await fs.unlink(abs);
      } catch {}
    }

    await this.projectRepo.remove(project);
  }
}
