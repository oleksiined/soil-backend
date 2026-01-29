import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { ProjectsModule } from './projects/projects.module';
import { KmlLayersModule } from './kml-layers/kml-layers.module';

import { User } from './auth/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Folder } from './folders/entities/folder.entity';
import { Project } from './projects/entities/project.entity';
import { KmlLayer } from './projects/entities/kml-layer.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, RefreshToken, Folder, Project, KmlLayer],
      synchronize: true,
    }),

    AuthModule,
    FoldersModule,
    ProjectsModule,
    KmlLayersModule,
  ],
})
export class AppModule {}
