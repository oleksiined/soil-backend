import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectEntity } from './entities/project.entity';
import { FolderEntity } from '../folders/entities/folder.entity';
import { KmlLayerEntity } from '../kml-layers/entities/kml-layer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity, FolderEntity, KmlLayerEntity])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
