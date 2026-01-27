import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => Project, (p) => p.folder)
  projects: Project[];
}
