import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmlLayer } from '../projects/entities/kml-layer.entity';
import { KmlLayersController } from './kml-layers.controller';
import { KmlLayersService } from './kml-layers.service';

@Module({
  imports: [TypeOrmModule.forFeature([KmlLayer])],
  controllers: [KmlLayersController],
  providers: [KmlLayersService],
})
export class KmlLayersModule {}
