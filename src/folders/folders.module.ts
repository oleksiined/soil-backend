import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderEntity } from './entities/folder.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FolderEntity, ProjectEntity])],
  providers: [FoldersService],
  controllers: [FoldersController],
})
export class FoldersModule {}
