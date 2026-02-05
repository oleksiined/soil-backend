import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

import { FolderEntity } from './entities/folder.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { KmlLayerEntity } from '../kml-layers/entities/kml-layer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FolderEntity,
      ProjectEntity,
      KmlLayerEntity,
    ]),
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
