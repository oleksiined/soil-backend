import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';
import { KmlLayer } from './entities/kml-layer.entity';

const UPLOAD_DIR = 'uploads/kml';

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

@Controller()
export class KmlLayersController {
  constructor(
    @InjectRepository(Project) private readonly projectsRepo: Repository<Project>,
    @InjectRepository(KmlLayer) private readonly kmlRepo: Repository<KmlLayer>,
  ) {}

  @Get('projects/:projectId/kml-layers')
  async getProjectKmlLayers(@Param('projectId') projectId: string) {
    const pid = Number(projectId);
    if (!Number.isFinite(pid)) throw new BadRequestException('Invalid projectId');

    return this.kmlRepo.find({
      where: { project: { id: pid } } as any,
      order: { id: 'ASC' } as any,
    });
  }

  @Post('projects/:projectId/kml-layers')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.kml';
          const base = safeName((file.originalname || 'kml').replace(ext, ''));
          const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
          cb(null, `${base}_${unique}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok =
          (file.mimetype || '').includes('kml') ||
          (file.originalname || '').toLowerCase().endsWith('.kml');
        cb(ok ? null : new BadRequestException('Only .kml allowed'), ok);
      },
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadProjectKml(
    @Param('projectId') projectId: string,
    @Body('type') type: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const pid = Number(projectId);
    if (!Number.isFinite(pid)) throw new BadRequestException('Invalid projectId');
    if (!file) throw new BadRequestException('file is required');

    const allowed = ['track', 'points', 'centroid', 'zones'];
    if (!allowed.includes(type)) throw new BadRequestException('Invalid type');

    const project = await this.projectsRepo.findOne({ where: { id: pid } as any });
    if (!project) throw new BadRequestException('Project not found');

    const layer = this.kmlRepo.create({
      project,
      type,
      originalName: file.originalname,
      path: `${UPLOAD_DIR}/${file.filename}`,
    } as any);

    return this.kmlRepo.save(layer);
  }
}
