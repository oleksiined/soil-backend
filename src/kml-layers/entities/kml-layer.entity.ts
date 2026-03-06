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

@Entity('kml_layers')
export class KmlLayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isArchived: boolean;

  // щоб було зручно і прозоро (і щоб INSERT руками не плутався)
  @Column({ name: 'project_id', type: 'int', nullable: true })
  projectId: number | null;

  @ManyToOne(() => ProjectEntity, (project) => project.kmlLayers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  /**
   * Геометрія зони (контур). PostGIS.
   * nullable=true — бо старі записи можуть ще не мати геометрії.
   */
  @Index('idx_kml_layers_geom', { synchronize: false })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geom: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}