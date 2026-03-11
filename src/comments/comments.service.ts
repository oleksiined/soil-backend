import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { CommentEntity } from './entities/comment.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  // ─────────────────────────────────────────────
  // Створення коментаря (з фото або без)
  // ─────────────────────────────────────────────

  async create(
    projectId: number,
    userId: number,
    dto: CreateCommentDto,
    photoFiles: Express.Multer.File[] = [],
  ): Promise<CommentEntity> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    // Зберігаємо фото і збираємо шляхи
    const photos = await this.savePhotos(photoFiles);

    const comment = this.commentRepo.create({
      projectId,
      project,
      userId,
      lat: dto.lat,
      lng: dto.lng,
      geom: {
        type: 'Point',
        coordinates: [dto.lng, dto.lat],
      } as any,
      problem: dto.problem,
      fieldName: dto.fieldName ?? null,
      kmlPointId: dto.kmlPointId ?? null,
      photos,
    });

    return this.commentRepo.save(comment);
  }

  // ─────────────────────────────────────────────
  // Список коментарів проєкту
  // ─────────────────────────────────────────────

  async getByProject(projectId: number): Promise<CommentEntity[]> {
    const exists = await this.projectRepo.existsBy({ id: projectId });
    if (!exists) throw new NotFoundException('Project not found');

    return this.commentRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────
  // Один коментар
  // ─────────────────────────────────────────────

  async getOne(id: number): Promise<CommentEntity> {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  // ─────────────────────────────────────────────
  // Оновлення (тільки свій коментар)
  // ─────────────────────────────────────────────

  async update(
    id: number,
    userId: number,
    userRole: string,
    dto: UpdateCommentDto,
    newPhotoFiles: Express.Multer.File[] = [],
  ): Promise<CommentEntity> {
    const comment = await this.findAndCheckOwnership(id, userId, userRole);

    // Додаємо нові фото до існуючих
    const newPhotos = await this.savePhotos(newPhotoFiles);
    const photos = [...comment.photos, ...newPhotos];

    Object.assign(comment, {
      ...(dto.problem !== undefined && { problem: dto.problem }),
      ...(dto.fieldName !== undefined && { fieldName: dto.fieldName }),
      ...(dto.kmlPointId !== undefined && { kmlPointId: dto.kmlPointId }),
      photos,
    });

    return this.commentRepo.save(comment);
  }

  // ─────────────────────────────────────────────
  // Видалення фото з коментаря
  // ─────────────────────────────────────────────

  async removePhoto(
    id: number,
    userId: number,
    userRole: string,
    photoPath: string,
  ): Promise<CommentEntity> {
    const comment = await this.findAndCheckOwnership(id, userId, userRole);

    // Видаляємо файл з диску
    const fullPath = path.join(process.cwd(), photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    comment.photos = comment.photos.filter((p) => p !== photoPath);
    return this.commentRepo.save(comment);
  }

  // ─────────────────────────────────────────────
  // Видалення коментаря (свій або Admin)
  // ─────────────────────────────────────────────

  async delete(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<{ ok: true }> {
    const comment = await this.findAndCheckOwnership(id, userId, userRole);

    // Видаляємо всі фото з диску
    for (const photoPath of comment.photos) {
      const fullPath = path.join(process.cwd(), photoPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await this.commentRepo.remove(comment);
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Коментарі в радіусі (для мобільного додатку)
  // ─────────────────────────────────────────────

  async getNearby(
    projectId: number,
    lat: number,
    lng: number,
    radiusMeters: number,
  ) {
    const exists = await this.projectRepo.existsBy({ id: projectId });
    if (!exists) throw new NotFoundException('Project not found');

    return this.commentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .where('c.project_id = :projectId', { projectId })
      .andWhere('c.geom IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          c.geom::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lat, lng, radius: radiusMeters },
      )
      .orderBy('c."createdAt"', 'DESC')
      .getMany();
  }

  // ─────────────────────────────────────────────
  // Приватні методи
  // ─────────────────────────────────────────────

  private async findAndCheckOwnership(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<CommentEntity> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    // Admin може редагувати/видаляти будь-який коментар
    if (userRole === 'ADMIN') return comment;

    // User — тільки свій
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only modify your own comments');
    }

    return comment;
  }

  private async savePhotos(files: Express.Multer.File[]): Promise<string[]> {
    if (!files.length) return [];

    const uploadDir = path.join(process.cwd(), 'uploads', 'comments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const paths: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);
      paths.push(`uploads/comments/${filename}`);
    }

    return paths;
  }
}
