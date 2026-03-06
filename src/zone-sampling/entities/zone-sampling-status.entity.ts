import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('zone_sampling_status')
@Index(['missionId', 'zoneId'], { unique: true })
export class ZoneSamplingStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mission_id' })
  missionId: number;

  @Column({ name: 'zone_id' })
  zoneId: number;

  @Column({ name: 'stops_count', default: 0 })
  stopsCount: number;

  @Column({ name: 'is_sampled', default: false })
  isSampled: boolean;

  @Column({ name: 'sampled_at', type: 'timestamptz', nullable: true })
  sampledAt: Date | null;

  @Column({ name: 'last_point_id', default: 0 })
  lastPointId: number;

  @Column({ name: 'in_stop', default: false })
  inStop: boolean;

  @Column({ name: 'stop_start_at', type: 'timestamptz', nullable: true })
  stopStartAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}