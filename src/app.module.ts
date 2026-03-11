import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FoldersModule } from './folders/folders.module';
import { ProjectsModule } from './projects/projects.module';
import { KmlLayersModule } from './kml-layers/kml-layers.module';
import { MissionsModule } from './missions/missions.module';
import { TracksModule } from './tracks/tracks.module';

import { ZoneSamplingModule } from './zone-sampling/zone-sampling.module';
import { CommentsModule } from './comments/comments.module';

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
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
    UsersModule,
    FoldersModule,
    ProjectsModule,
    KmlLayersModule,
    MissionsModule,
    TracksModule,
    ZoneSamplingModule,
    CommentsModule,
  ],
})
export class AppModule {}