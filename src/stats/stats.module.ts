import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleEvent } from '../sampling/entities/sample-event.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([SampleEvent])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
