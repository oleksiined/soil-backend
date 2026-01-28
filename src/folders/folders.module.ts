import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Folder } from './entities/folder.entity';
import { Project } from '../projects/entities/project.entity';
import { KmlLayer } from '../projects/entities/kml-layer.entity';

import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Project, KmlLayer])],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
