import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KmlLayersController } from './kml-layers.controller';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayerEntity } from './entities/kml-layer.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KmlLayerEntity,
      ProjectEntity, // ⬅️ ОЦЕ було відсутнє
    ]),
  ],
  controllers: [KmlLayersController],
  providers: [KmlLayersService],
})
export class KmlLayersModule {}
