import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { LiveGateway } from './live.gateway';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { LiveShareTokenEntity } from './entities/live-share-token.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveShareTokenEntity,
      ProjectEntity,
    ]),
    // JwtModule потрібен Gateway для верифікації токенів при WS підключенні
    JwtModule.register({}),
  ],
  controllers: [LiveController],
  providers: [LiveGateway, LiveService],
  exports: [LiveGateway, LiveService],
})
export class LiveModule {}
