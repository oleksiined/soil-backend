import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Mission } from './entities/mission.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mission, ProjectEntity])],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
