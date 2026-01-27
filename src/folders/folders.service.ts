import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Folder } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(@InjectRepository(Folder) private repo: Repository<Folder>) {}

  create(dto: CreateFolderDto) {
    if (!dto?.name) throw new BadRequestException('name is required');
    return this.repo.save(this.repo.create(dto));
  }

  // ✅ за замовчуванням показуємо тільки НЕархівні
  findAll(includeArchived = false) {
    if (includeArchived) return this.repo.find({ relations: { projects: true } });

    return this.repo.find({
      where: { isArchived: false },
      relations: { projects: true },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: { projects: true } });
  }

  async update(id: number, dto: UpdateFolderDto) {
    await this.repo.update({ id }, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Folder not found');
    await this.repo.delete({ id });
    return { deleted: true, id };
  }

  async archive(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Folder not found');
    await this.repo.update({ id }, { isArchived: true });
    return { archived: true, id };
  }

  async unarchive(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Folder not found');
    await this.repo.update({ id }, { isArchived: false });
    return { archived: false, id };
  }
}
