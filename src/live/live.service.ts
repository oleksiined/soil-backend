import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { LiveShareTokenEntity } from './entities/live-share-token.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

// ─── Стан водія в пам'яті ───────────────────
export interface DriverState {
  userId: number;
  username: string;
  missionId: number | null;
  projectId: number | null;
  lat: number | null;
  lng: number | null;
  status: 'online' | 'offline';
  lastSeenAt: Date;
}

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(LiveShareTokenEntity)
    private readonly tokenRepo: Repository<LiveShareTokenEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  // ─── In-memory стан всіх онлайн водіїв ───
  // Map<userId, DriverState>
  private readonly drivers = new Map<number, DriverState>();

  // ─────────────────────────────────────────────
  // Оновити позицію водія (викликається з Gateway)
  // ─────────────────────────────────────────────

  updateDriver(
    userId: number,
    username: string,
    data: {
      missionId?: number;
      projectId?: number;
      lat?: number;
      lng?: number;
      status?: 'online' | 'offline';
    },
  ): DriverState {
    const existing = this.drivers.get(userId);

    const state: DriverState = {
      userId,
      username,
      missionId: data.missionId ?? existing?.missionId ?? null,
      projectId: data.projectId ?? existing?.projectId ?? null,
      lat: data.lat ?? existing?.lat ?? null,
      lng: data.lng ?? existing?.lng ?? null,
      status: data.status ?? existing?.status ?? 'online',
      lastSeenAt: new Date(),
    };

    this.drivers.set(userId, state);
    return state;
  }

  // ─────────────────────────────────────────────
  // Водій відключився
  // ─────────────────────────────────────────────

  setOffline(userId: number): DriverState | null {
    const state = this.drivers.get(userId);
    if (!state) return null;

    state.status = 'offline';
    state.lastSeenAt = new Date();
    this.drivers.set(userId, state);
    return state;
  }

  // ─────────────────────────────────────────────
  // Всі онлайн водії
  // ─────────────────────────────────────────────

  getAllDrivers(): DriverState[] {
    return [...this.drivers.values()];
  }

  // ─────────────────────────────────────────────
  // Водії по проєкту
  // ─────────────────────────────────────────────

  getDriversByProject(projectId: number): DriverState[] {
    return [...this.drivers.values()].filter(
      (d) => d.projectId === projectId,
    );
  }

  // ─────────────────────────────────────────────
  // Створити публічне посилання (7 днів)
  // ─────────────────────────────────────────────

  async createShareToken(
    projectId: number,
    createdBy: number,
  ): Promise<LiveShareTokenEntity> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 днів

    const entity = this.tokenRepo.create({
      token,
      projectId,
      createdBy,
      expiresAt,
    });

    return this.tokenRepo.save(entity);
  }

  // ─────────────────────────────────────────────
  // Список активних посилань проєкту
  // ─────────────────────────────────────────────

  async getShareTokens(projectId: number): Promise<LiveShareTokenEntity[]> {
    return this.tokenRepo
      .createQueryBuilder('t')
      .where('t.project_id = :projectId', { projectId })
      .andWhere('t.expires_at > NOW()')
      .orderBy('t.created_at', 'DESC')
      .getMany();
  }

  // ─────────────────────────────────────────────
  // Анулювати посилання
  // ─────────────────────────────────────────────

  async revokeShareToken(id: number): Promise<{ ok: true }> {
    const token = await this.tokenRepo.findOne({ where: { id } });
    if (!token) throw new NotFoundException('Share token not found');
    await this.tokenRepo.remove(token);
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Перевірити публічний токен (для WS підключення)
  // ─────────────────────────────────────────────

  async validateShareToken(token: string): Promise<LiveShareTokenEntity> {
    const entity = await this.tokenRepo.findOne({ where: { token } });

    if (!entity) throw new ForbiddenException('Invalid share token');
    if (entity.expiresAt < new Date()) {
      throw new ForbiddenException('Share token expired');
    }

    return entity;
  }
}
