import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan } from 'typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

import { Project } from './entities/project.entity';
import { KmlLayer, KmlType } from './entities/kml-layer.entity';
import { ProjectDto } from './dto/project.dto';
import { KmlLayerDto } from './dto/kml-layer.dto';
import { ProjectsSyncDto } from './dto/projects-sync.dto';

function normalizeType(v?: string): KmlType {
  const t = String(v || '').toLowerCase().trim();
  if (t === 'track' || t === 'centroid' || t === 'points' || t === 'zones') return t;
  return 'track';
}

function toProjectDto(p: Project): ProjectDto {
  if (p.folderId == null) throw new BadRequestException('Project has no folderId');
  return {
    id: p.id,
    folderId: p.folderId,
    name: p.name,
    isArchived: p.isArchived,
  };
}

function toKmlLayerDto(l: KmlLayer): KmlLayerDto {
  return {
    id: l.id,
    projectId: l.projectId,
    type: l.type,
    originalName: l.originalName,
    sizeBytes: l.sizeBytes || 0,
    isArchived: l.isArchived,
    fileUrl: `/api/kml-layers/${l.id}/file`,
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(KmlLayer) private readonly kmlRepo: Repository<KmlLayer>,
  ) {}

  async createProject(folderId: number, name: string) {
    const project = this.projectRepo.create({ folderId, name: String(name || '').trim() });
    const saved = await this.projectRepo.save(project);
    return toProjectDto(saved);
  }

  async getProjectKmlLayers(projectId: number, includeArchived: boolean) {
    const layers = await this.kmlRepo.find({
      where: includeArchived ? { projectId } : { projectId, isArchived: false },
      order: { id: 'ASC' },
    });
    return layers.map(toKmlLayerDto);
  }

  async getProjectDetails(projectId: number, includeArchived: boolean) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const layers = await this.kmlRepo.find({
      where: includeArchived ? { projectId } : { projectId, isArchived: false },
      order: { id: 'ASC' },
    });

    return {
      project: toProjectDto(project),
      kmlLayers: layers.map(toKmlLayerDto),
    };
  }

  async syncProjectsSinceId(
    sinceProjectId: number,
    sinceLayerId: number,
  ): Promise<ProjectsSyncDto> {
    const rawProjects = await this.projectRepo.find({
      where: { id: MoreThan(sinceProjectId) },
      order: { id: 'ASC' },
    });

    const validProjects = rawProjects.filter((p) => p.folderId != null);
    const projects = validProjects.map(toProjectDto);
    const projectIds = validProjects.map((p) => p.id);

    const layersById = await this.kmlRepo.find({
      where: { id: MoreThan(sinceLayerId) },
      order: { id: 'ASC' },
    });

    const layers = projectIds.length ? layersById.filter((l) => projectIds.includes(l.projectId)) : [];

    return {
      serverTime: new Date().toISOString(),
      projects,
      kmlLayers: layers.map(toKmlLayerDto),
    };
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
      sizeBytes: file.size || 0,
      isArchived: false,
    });

    const saved = await this.kmlRepo.save(layer);
    return toKmlLayerDto(saved);
  }

  async setArchived(id: number, isArchived: boolean) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    project.isArchived = isArchived;
    const saved = await this.projectRepo.save(project);
    return toProjectDto(saved);
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
