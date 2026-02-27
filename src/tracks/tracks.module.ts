import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TrackPoint } from './entities/track-point.entity';
import { Mission } from '../missions/entities/mission.entity';
import { TracksService } from './tracks.service';
import { TracksController } from './tracks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TrackPoint, Mission])],
  controllers: [TracksController],
  providers: [TracksService],
})
export class TracksModule {}
