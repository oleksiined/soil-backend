import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZoneSamplingWorkerService } from './zone-sampling/zone-sampling.worker.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const worker = app.get(ZoneSamplingWorkerService);
  worker.start();
}

bootstrap();