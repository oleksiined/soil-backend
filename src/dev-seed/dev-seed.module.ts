import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevSeedService } from './dev-seed.service';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [DevSeedService],
})
export class DevSeedModule {}
