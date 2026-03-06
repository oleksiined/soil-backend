import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Mission } from './entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mission,
      TrackPoint,
      ProjectEntity, // 🔥 ОБОВʼЯЗКОВО
    ]),
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}