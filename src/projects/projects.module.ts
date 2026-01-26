import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Folder } from '../folders/entities/folder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Folder])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
