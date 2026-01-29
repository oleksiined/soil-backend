import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Track } from './entities/track.entity';
import { TrackPoint } from './entities/track-point.entity';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Track, TrackPoint])],
  controllers: [TracksController],
  providers: [TracksService],
})
export class TracksModule {}
