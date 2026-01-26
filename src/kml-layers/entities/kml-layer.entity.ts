import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export type KmlLayerType = 'tracks' | 'points' | 'centroid' | 'zones';

@Entity('kml_layers')
export class KmlLayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'text' })
  type: KmlLayerType;

  @Column({ type: 'text' })
  originalName: string;

  @Column({ type: 'text' })
  path: string;

  @CreateDateColumn()
  created_at: Date;
}
