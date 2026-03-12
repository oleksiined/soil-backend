import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessController } from './access.controller';
import { MyProjectsController } from './my-projects.controller';
import { AccessService } from './access.service';
import { ProjectAccessGuard } from './project-access.guard';

import { UserProjectAccessEntity } from './entities/user-project-access.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProjectAccessEntity,
      UserEntity,
      ProjectEntity,
    ]),
  ],
  controllers: [
    AccessController,
    MyProjectsController,
  ],
  providers: [
    AccessService,
    ProjectAccessGuard,
  ],
  exports: [
    AccessService,
    ProjectAccessGuard,
  ],
})
export class AccessModule {}
