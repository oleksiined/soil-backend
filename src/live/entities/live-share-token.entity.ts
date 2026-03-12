import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('live_share_tokens')
@Index('idx_live_share_token', ['token'], { unique: true })
@Index('idx_live_share_project_id', ['projectId'])
export class LiveShareTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** Унікальний токен для публічного посилання */
  @Column({ type: 'text', unique: true })
  token: string;

  /** До якого проєкту відноситься посилання */
  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  /** Хто створив посилання */
  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  /** Коли закінчується дія посилання */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
