import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FolderEntity } from './entities/folder.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { KmlLayerEntity } from '../kml-layers/entities/kml-layer.entity';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folders: Repository<FolderEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,

    @InjectRepository(KmlLayerEntity)
    private readonly kml: Repository<KmlLayerEntity>,
  ) {}

  async getFolders(includeArchived = false): Promise<FolderEntity[]> {
    try {
      const qb = this.folders
        .createQueryBuilder('f')
        .leftJoinAndSelect('f.projects', 'p')
        .orderBy('f.id', 'ASC')
        .addOrderBy('p.id', 'ASC');

      if (!includeArchived) {
        qb.where('f.isArchived = false');
      }

      return await qb.getMany();
    } catch (e: any) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to load folders');
    }
  }

  async createFolder(name: string): Promise<FolderEntity> {
    try {
      const folder = this.folders.create({
        name,
        isArchived: false,
      });

      return await this.folders.save(folder);
    } catch (e: any) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to create folder');
    }
  }

  async setArchived(id: number, archived: boolean): Promise<{ ok: true }> {
    try {
      await this.folders.update({ id }, { isArchived: archived });

      if (archived) {
        const projects = await this.projects.find({
          where: { folder: { id } },
        });

        if (projects.length) {
          const projectIds = projects.map((p) => p.id);

          await this.projects.update(
            { id: projectIds as any },
            { isArchived: true },
          );

          await this.kml.update(
            { project: { id: projectIds as any } },
            { isArchived: true },
          );
        }
      }

      return { ok: true };
    } catch (e: any) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to update folder');
    }
  }

  async deleteFolderDeep(id: number): Promise<{ ok: true }> {
    try {
      const folder = await this.folders.findOne({
        where: { id },
        relations: { projects: true },
      });

      if (!folder) return { ok: true };

      await this.folders.remove(folder);
      return { ok: true };
    } catch (e: any) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to delete folder');
    }
  }
}
