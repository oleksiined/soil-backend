import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sample_events' })
export class SampleEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @Column({ name: 'sampling_point_id', type: 'int', nullable: true })
  samplingPointId: number | null;

  @Column({ type: 'text' })
  eventType: 'DONE' | 'UNDO';

  @Column({ type: 'text', nullable: true })
  doneType: 'AUTO' | 'MANUAL' | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
