import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folders: Repository<FolderEntity>,
  ) {}

  async getFolders(includeArchived = false): Promise<FolderEntity[]> {
    try {
      const qb = this.folders
        .createQueryBuilder('f')
        .leftJoinAndSelect('f.projects', 'p')
        .orderBy('f.id', 'ASC')
        .addOrderBy('p.id', 'ASC');

      if (!includeArchived) {
        qb.where('f.isArchived = :arch', { arch: false });
      }

      return await qb.getMany();
    } catch (e: any) {
      this.logger.error('Failed to load folders from database');
      this.logger.error(e?.message || e);
      if (e?.query) this.logger.error(`SQL: ${e.query}`);
      if (e?.parameters) this.logger.error(`Params: ${JSON.stringify(e.parameters)}`);
      throw new InternalServerErrorException('Failed to load folders from database');
    }
  }

  async createFolder(name: string): Promise<FolderEntity> {
    try {
      const folder: FolderEntity = this.folders.create({
        name,
        isArchived: false,
      } as Partial<FolderEntity>) as FolderEntity;

      const saved: FolderEntity = await this.folders.save(folder);
      return saved;
    } catch (e: any) {
      this.logger.error('Failed to create folder');
      this.logger.error(e?.message || e);
      if (e?.query) this.logger.error(`SQL: ${e.query}`);
      if (e?.parameters) this.logger.error(`Params: ${JSON.stringify(e.parameters)}`);
      throw new InternalServerErrorException('Failed to create folder');
    }
  }

  async setArchived(id: number, archived: boolean): Promise<{ ok: true }> {
    try {
      await this.folders.update({ id } as any, { isArchived: archived } as any);
      return { ok: true };
    } catch (e: any) {
      this.logger.error('Failed to update folder archive flag');
      this.logger.error(e?.message || e);
      if (e?.query) this.logger.error(`SQL: ${e.query}`);
      if (e?.parameters) this.logger.error(`Params: ${JSON.stringify(e.parameters)}`);
      throw new InternalServerErrorException('Failed to update folder');
    }
  }

  async deleteFolderDeep(id: number): Promise<{ ok: true }> {
    try {
      const folder = await this.folders.findOne({
        where: { id } as any,
        relations: { projects: true } as any,
      });

      if (!folder) return { ok: true };

      await this.folders.remove(folder);
      return { ok: true };
    } catch (e: any) {
      this.logger.error('Failed to delete folder');
      this.logger.error(e?.message || e);
      if (e?.query) this.logger.error(`SQL: ${e.query}`);
      if (e?.parameters) this.logger.error(`Params: ${JSON.stringify(e.parameters)}`);
      throw new InternalServerErrorException('Failed to delete folder');
    }
  }
}
