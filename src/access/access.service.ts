import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { UserProjectAccessEntity } from './entities/user-project-access.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserProjectAccessEntity)
    private readonly accessRepo: Repository<UserProjectAccessEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  // ─────────────────────────────────────────────
  // Надати доступ юзеру до проєкту
  // ─────────────────────────────────────────────

  async grantAccess(userId: number, projectId: number, grantedBy: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Admin бачить всі проєкти — йому доступ не потрібен
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admin already has access to all projects');
    }

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const existing = await this.accessRepo.findOne({
      where: { userId, projectId },
    });
    if (existing) {
      throw new ConflictException(`User ${userId} already has access to project ${projectId}`);
    }

    const access = this.accessRepo.create({ userId, projectId, grantedBy });
    return this.accessRepo.save(access);
  }

  // ─────────────────────────────────────────────
  // Надати доступ до кількох проєктів одразу
  // ─────────────────────────────────────────────

  async grantBatch(
    userId: number,
    projectIds: number[],
    grantedBy: number,
  ): Promise<{ granted: number[]; skipped: number[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admin already has access to all projects');
    }

    // Перевіряємо що всі проєкти існують
    const projects = await this.projectRepo.find({
      where: { id: In(projectIds) },
      select: ['id'],
    });
    const existingProjectIds = projects.map((p) => p.id);
    const missingIds = projectIds.filter((id) => !existingProjectIds.includes(id));
    if (missingIds.length) {
      throw new NotFoundException(`Projects not found: ${missingIds.join(', ')}`);
    }

    // Знаходимо вже існуючі доступи
    const existing = await this.accessRepo.find({
      where: { userId, projectId: In(projectIds) },
      select: ['projectId'],
    });
    const alreadyGranted = new Set(existing.map((a) => a.projectId));

    const toGrant = projectIds.filter((id) => !alreadyGranted.has(id));
    const skipped = projectIds.filter((id) => alreadyGranted.has(id));

    if (toGrant.length) {
      const records = toGrant.map((projectId) =>
        this.accessRepo.create({ userId, projectId, grantedBy }),
      );
      await this.accessRepo.save(records);
    }

    return { granted: toGrant, skipped };
  }

  // ─────────────────────────────────────────────
  // Забрати доступ
  // ─────────────────────────────────────────────

  async revokeAccess(userId: number, projectId: number): Promise<{ ok: true }> {
    const access = await this.accessRepo.findOne({ where: { userId, projectId } });
    if (!access) {
      throw new NotFoundException(`User ${userId} has no access to project ${projectId}`);
    }

    await this.accessRepo.remove(access);
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Забрати всі доступи юзера
  // ─────────────────────────────────────────────

  async revokeAll(userId: number): Promise<{ ok: true; count: number }> {
    const result = await this.accessRepo.delete({ userId });
    return { ok: true, count: result.affected ?? 0 };
  }

  // ─────────────────────────────────────────────
  // Список проєктів до яких юзер має доступ
  // ─────────────────────────────────────────────

  async getProjectsForUser(userId: number): Promise<ProjectEntity[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Admin бачить всі проєкти
    if (user.role === 'ADMIN') {
      return this.projectRepo.find({
        where: { isArchived: false },
        relations: ['missions', 'kmlLayers'],
        order: { id: 'ASC' },
      });
    }

    const accesses = await this.accessRepo.find({
      where: { userId },
      relations: ['project', 'project.missions', 'project.kmlLayers'],
      order: { projectId: 'ASC' },
    });

    return accesses
      .map((a) => a.project)
      .filter((p) => p && !p.isArchived);
  }

  // ─────────────────────────────────────────────
  // Список юзерів що мають доступ до проєкту
  // ─────────────────────────────────────────────

  async getUsersForProject(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const accesses = await this.accessRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return accesses.map((a) => ({
      accessId: a.id,
      userId: a.userId,
      username: a.user.username,
      role: a.user.role,
      grantedBy: a.grantedBy,
      grantedAt: a.createdAt,
    }));
  }

  // ─────────────────────────────────────────────
  // Перевірка доступу (для Guard)
  // ─────────────────────────────────────────────

  async hasAccess(userId: number, projectId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
    if (!user) return false;

    // Admin має доступ до всього
    if (user.role === 'ADMIN') return true;

    return this.accessRepo.existsBy({ userId, projectId });
  }
}
