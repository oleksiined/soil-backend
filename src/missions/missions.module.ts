import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Mission } from './entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission, TrackPoint]),
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}