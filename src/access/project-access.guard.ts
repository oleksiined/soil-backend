import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AccessService } from './access.service';

/**
 * Перевіряє чи має поточний юзер доступ до проєкту.
 * Зчитує projectId з:
 *  - params.projectId
 *  - params.id (якщо контролер використовує :id для проєкту)
 *
 * Використання:
 *  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private readonly accessService: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Admin — пропускаємо без перевірки
    if (user?.role === 'ADMIN') return true;

    const projectId =
      Number(req.params?.projectId) || Number(req.params?.id);

    if (!projectId) {
      throw new NotFoundException('Project ID not found in request');
    }

    const hasAccess = await this.accessService.hasAccess(user.sub, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return true;
  }
}
