import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmlLayersController } from './kml-layers.controller';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayer } from '../projects/entities/kml-layer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KmlLayer])],
  controllers: [KmlLayersController],
  providers: [KmlLayersService],
  exports: [KmlLayersService],
})
export class KmlLayersModule {}
