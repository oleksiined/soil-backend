import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from './entities/project.entity';
import { KmlLayer } from './entities/kml-layer.entity';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, KmlLayer])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
