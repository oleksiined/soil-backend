import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';

/**
 * Типи KML файлів:
 * - contour   : контури зон (Polygon) — підсвічуються після відбору
 * - track     : треки відбору (LineString) — маршрут по зонах
 * - point     : точки забурювання (Point) — 18-20 шт на трек
 * - centroid  : центроїди зон (Point) — для відображення назви зони
 */
export type KmlFileType = 'contour' | 'track' | 'point' | 'centroid';

export interface KmlPlacemark {
  id: string;
  name: string;
  /** Для contour: координати полігону */
  polygon?: number[][][];
  /** Для track: масив ліній (може бути кілька LineString в одному файлі) */
  lines?: number[][][];
  /** Для point/centroid: координата точки */
  point?: [number, number]; // [lng, lat]
  /** Розширені атрибути з ExtendedData */
  attributes?: Record<string, string>;
}

@Entity('kml_files')
@Index('idx_kml_files_project_id', ['projectId'])
@Index('idx_kml_files_type', ['type'])
export class KmlFileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  /** Оригінальна назва файлу */
  @Column({ type: 'text' })
  originalName: string;

  /** Тип KML файлу — визначається автоматично при завантаженні */
  @Column({ type: 'text' })
  type: KmlFileType;

  /** Сирий KML контент */
  @Column({ type: 'text' })
  rawContent: string;

  /**
   * Розпарсені об'єкти з KML.
   * JSON масив KmlPlacemark[]
   */
  @Column({ type: 'jsonb' })
  placemarks: KmlPlacemark[];

  /** Кількість об'єктів в файлі */
  @Column({ type: 'int', default: 0 })
  featureCount: number;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
