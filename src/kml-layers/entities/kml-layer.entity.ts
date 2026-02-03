import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
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

  @ManyToOne(() => ProjectEntity, (project) => project.kmlLayers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
