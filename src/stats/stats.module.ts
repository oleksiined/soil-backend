import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

import { ZoneSamplingStatus } from '../zone-sampling/entities/zone-sampling-status.entity';
import { Mission } from '../missions/entities/mission.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ZoneSamplingStatus,
      Mission,
      UserEntity,
      ProjectEntity,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
