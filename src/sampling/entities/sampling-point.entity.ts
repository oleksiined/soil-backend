import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type DoneType = 'AUTO' | 'MANUAL';

@Entity({ name: 'sampling_points' })
export class SamplingPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @Column({ name: 'done_type', type: 'text', nullable: true })
  doneType: DoneType | null;

  @Column({ name: 'done_by_user_id', type: 'int', nullable: true })
  doneByUserId: number | null;

  @Column({ name: 'done_at', type: 'timestamptz', nullable: true })
  doneAt: Date | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
