import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: 'new' })
  status: string;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => ProjectEntity, (project) => project.missions, {
    onDelete: 'CASCADE',
  })
  project: ProjectEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
