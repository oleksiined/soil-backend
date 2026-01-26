import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MissionsModule } from './missions/missions.module';
import { FoldersModule } from './folders/folders.module';
import { ProjectsModule } from './projects/projects.module';
import { KmlLayersModule } from './kml-layers/kml-layers.module';

import { Mission } from './missions/entities/mission.entity';
import { Folder } from './folders/entities/folder.entity';
import { Project } from './projects/entities/project.entity';
import { KmlLayer } from './kml-layers/entities/kml-layer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '4893',
      database: 'soil',
      entities: [Mission, Folder, Project, KmlLayer],
      synchronize: true,
    }),

    MissionsModule,
    FoldersModule,
    ProjectsModule,
    KmlLayersModule,
  ],
})
export class AppModule {}
