import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FolderEntity } from './entities/folder.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(FolderEntity)
    private readonly repo: Repository<FolderEntity>,
  ) {}

  async getFolders(includeArchived = false) {
    return this.repo.find({
      where: includeArchived ? {} : { isArchived: false },
      relations: {
        projects: {
          missions: true,
          kmlLayers: true,
        },
      },
      order: {
        id: 'ASC',
        projects: {
          id: 'ASC',
          missions: { id: 'ASC' },
          kmlLayers: { id: 'ASC' },
        },
      },
    });
  }

  async createFolder(name: string) {
    const folder = this.repo.create({
      name,
      isArchived: false,
    });

    return this.repo.save(folder);
  }

  async setArchived(id: number, archived: boolean) {
    await this.repo.update(id, { isArchived: archived });
    return { ok: true };
  }

  async deleteFolderDeep(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
