import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TrackPoint } from './track-point.entity';

@Entity({ name: 'tracks' })
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'project_id', type: 'int', nullable: true })
  projectId: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  stopped_at: Date | null;

  @OneToMany(() => TrackPoint, (p) => p.track, { cascade: true })
  points: TrackPoint[];
}
