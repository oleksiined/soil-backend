import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KmlLayersController } from './kml-layers.controller';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayerEntity } from './entities/kml-layer.entity';

import { KmlFileEntity } from './entities/kml-file.entity';
import { KmlParserService } from './kml-parser.service';
import { KmlUploadService } from './kml-upload.service';
import { KmlUploadController } from './kml-upload.controller';

import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KmlLayerEntity,
      KmlFileEntity,
      ProjectEntity,
    ]),
  ],
  controllers: [
    KmlLayersController,
    KmlUploadController,
  ],
  providers: [
    KmlLayersService,
    KmlParserService,
    KmlUploadService,
  ],
  exports: [
    KmlParserService,
    KmlUploadService,
  ],
})
export class KmlLayersModule {}
