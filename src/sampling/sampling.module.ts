import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SamplingPoint } from './entities/sampling-point.entity';
import { SampleEvent } from './entities/sample-event.entity';
import { SamplingController } from './sampling.controller';
import { SamplingService } from './sampling.service';

@Module({
  imports: [TypeOrmModule.forFeature([SamplingPoint, SampleEvent])],
  controllers: [SamplingController],
  providers: [SamplingService],
  exports: [TypeOrmModule],
})
export class SamplingModule {}
