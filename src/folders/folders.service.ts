import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

import { Folder } from './entities/folder.entity';
import { Project } from '../projects/entities/project.entity';
import { KmlLayer } from '../projects/entities/kml-layer.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder) private readonly folderRepo: Repository<Folder>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(KmlLayer) private readonly kmlRepo: Repository<KmlLayer>,
  ) {}

  async getFolders(includeArchived: boolean) {
    const foldersAll = await this.folderRepo.find({ order: { id: 'ASC' } });
    const folders = includeArchived ? foldersAll : foldersAll.filter((f) => !f.isArchived);

    const folderIds = foldersAll.map((f) => f.id);

    const projects = folderIds.length
      ? await this.projectRepo.find({
          where: includeArchived
            ? { folderId: In(folderIds) }
            : { folderId: In(folderIds), isArchived: false },
          order: { id: 'ASC' },
        })
      : [];

    const byFolder: Record<number, Project[]> = {};
    for (const p of projects) {
      const fid = p.folderId ?? 0;
      byFolder[fid] = byFolder[fid] || [];
      byFolder[fid].push(p);
    }

    return folders.map((f) => ({ ...f, projects: byFolder[f.id] || [] }));
  }

  async createFolder(name: string) {
    const folder = this.folderRepo.create({ name: String(name || '').trim() });
    return this.folderRepo.save(folder);
  }

  async setArchived(id: number, isArchived: boolean) {
    const folder = await this.folderRepo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');

    folder.isArchived = isArchived;
    await this.folderRepo.save(folder);

    return { ok: true };
  }

  async deleteFolderDeep(folderId: number) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const projects = await this.projectRepo.find({ where: { folderId } });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length) {
      const layers = await this.kmlRepo.find({ where: { projectId: In(projectIds) } });

      for (const l of layers) {
        const storedPath = l.path || '';
        if (!storedPath) continue;

        const abs = path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath);
        try {
          await fs.unlink(abs);
        } catch {}
      }
    }

    await this.folderRepo.remove(folder);
    return { ok: true };
  }
}
