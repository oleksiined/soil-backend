import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => ProjectEntity, (project) => project.folder)
  projects: ProjectEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
