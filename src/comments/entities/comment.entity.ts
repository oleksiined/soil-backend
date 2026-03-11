import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('comments')
@Index('idx_comments_project_id', ['projectId'])
@Index('idx_comments_user_id', ['userId'])
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── Прив'язка до проєкту ───
  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  // ─── Автор коментаря ───
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // ─── Координати точки на карті ───
  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geom: any;

  // ─── Поля коментаря ───

  /** Назва поля (з KML centroid або вводиться вручну) */
  @Column({ type: 'text', nullable: true })
  fieldName: string | null;

  /** Опис проблеми */
  @Column({ type: 'text' })
  problem: string;

  /**
   * Прив'язка до точки забурювання (kml_files.placemarks[n].id)
   * nullable — бо коментар можна залишити без прив'язки до точки
   */
  @Column({ type: 'text', nullable: true })
  kmlPointId: string | null;

  /**
   * Фото — масив шляхів до файлів на сервері
   * Зберігаємо як JSON масив: ["uploads/comments/123_photo1.jpg", ...]
   */
  @Column({ type: 'jsonb', default: '[]' })
  photos: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
