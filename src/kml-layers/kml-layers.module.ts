import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmlLayerEntity } from './entities/kml-layer.entity';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayersController } from './kml-layers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KmlLayerEntity])],
  controllers: [KmlLayersController],
  providers: [KmlLayersService],
})
export class KmlLayersModule {}
