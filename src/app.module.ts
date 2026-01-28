import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { FoldersModule } from './folders/folders.module';
import { ProjectsModule } from './projects/projects.module';
import { KmlLayersModule } from './kml-layers/kml-layers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // бере .env з кореня soil-backend
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),

    FoldersModule,
    ProjectsModule,
    KmlLayersModule,
  ],
})
export class AppModule {}
