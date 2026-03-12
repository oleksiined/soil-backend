import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { AccessService } from './access.service';

@ApiTags('My Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('my')
export class MyProjectsController {
  constructor(private readonly service: AccessService) {}

  @Get('projects')
  @ApiOperation({
    summary: 'Мої проєкти (для поточного юзера)',
    description:
      'User бачить тільки ті проєкти, до яких Admin надав доступ. ' +
      'Admin бачить всі проєкти.',
  })
  getMyProjects(@Request() req: any) {
    return this.service.getProjectsForUser(req.user.sub);
  }
}
