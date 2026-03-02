import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { TrackPoint } from '../../tracks/entities/track-point.entity';

@Entity('missions')
@Index('idx_missions_project_id', ['projectId'])
@Index('idx_missions_archived', ['isArchived'])
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: 'new' })
  status: string;

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => TrackPoint, (point) => point.mission)
  trackPoints: TrackPoint[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}