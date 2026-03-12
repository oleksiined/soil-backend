import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('user_project_access')
@Unique('uq_user_project', ['userId', 'projectId'])
@Index('idx_upa_user_id', ['userId'])
@Index('idx_upa_project_id', ['projectId'])
export class UserProjectAccessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  /** Хто надав доступ */
  @Column({ name: 'granted_by', type: 'int' })
  grantedBy: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
