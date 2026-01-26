import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmlLayersService } from './kml-layers.service';
import { KmlLayersController } from './kml-layers.controller';
import { KmlLayer } from './entities/kml-layer.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KmlLayer, Project])],
  controllers: [KmlLayersController],
  providers: [KmlLayersService],
})
export class KmlLayersModule {}
