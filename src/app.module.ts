import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { FoldersModule } from './folders/folders.module';
import { ProjectsModule } from './projects/projects.module';
import { KmlLayersModule } from './kml-layers/kml-layers.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { FolderEntity } from './folders/entities/folder.entity';
import { ProjectEntity } from './projects/entities/project.entity';
import { KmlLayerEntity } from './kml-layers/entities/kml-layer.entity';
import { UserEntity } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      // ВАЖЛИВО: ми НЕ вмикаємо synchronize, як і домовлялись
      synchronize: false,

      // Сутності (додай/прибери якщо у тебе інший набір)
      entities: [FolderEntity, ProjectEntity, KmlLayerEntity, UserEntity],

      // ОЦЕ головне: TypeORM буде показувати SQL помилки в консоль
      logging: ['error'],
      logger: 'advanced-console',
    }),

    AuthModule,
    UsersModule,
    FoldersModule,
    ProjectsModule,
    KmlLayersModule,
  ],
})
export class AppModule {}
