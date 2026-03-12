import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneSamplingStatus } from './entities/zone-sampling-status.entity';
import { MissionProcessingQueue } from './entities/mission-processing-queue.entity';
import { ZoneSamplingService } from './zone-sampling.service';
import { ZoneSamplingWorkerService } from './zone-sampling.worker.service';
import { ZoneSamplingController } from './zone-sampling.controller';
import { Mission } from '../missions/entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ZoneSamplingStatus,
      MissionProcessingQueue,
      Mission,
      TrackPoint,
    ]),
  ],
  controllers: [ZoneSamplingController],
  providers: [ZoneSamplingService, ZoneSamplingWorkerService],
  exports: [ZoneSamplingService],
})
export class ZoneSamplingModule {}
