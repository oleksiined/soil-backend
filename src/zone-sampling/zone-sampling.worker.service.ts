import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissionProcessingQueue } from './entities/mission-processing-queue.entity';
import { ZoneSamplingService } from './zone-sampling.service';

@Injectable()
export class ZoneSamplingWorkerService {
  constructor(
    @InjectRepository(MissionProcessingQueue)
    private readonly queueRepo: Repository<MissionProcessingQueue>,
    private readonly samplingService: ZoneSamplingService,
  ) {}

  start() {
    setInterval(async () => {
      const items = await this.queueRepo.find();

      for (const item of items) {
        await this.samplingService.processMission(item.missionId);
        await this.queueRepo.delete({ missionId: item.missionId });
      }
    }, 2000);
  }
}