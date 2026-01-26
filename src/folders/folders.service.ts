import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class FoldersService {
  constructor(@InjectRepository(Folder) private repo: Repository<Folder>) {}

  create(dto: CreateFolderDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ relations: { projects: true } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: { projects: true } });
  }
}
