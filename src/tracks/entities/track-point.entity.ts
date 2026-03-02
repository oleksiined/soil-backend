import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Mission } from '../../missions/entities/mission.entity';

@Entity('track_points')
@Index('idx_track_points_mission_id', ['missionId'])
@Index('idx_track_points_mission_id_timestamp', ['missionId', 'timestamp'])
export class TrackPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mission_id', type: 'int' })
  missionId: number;

  @ManyToOne(() => Mission, (mission) => mission.trackPoints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'double precision', nullable: true })
  speed: number | null;

  @Column({ type: 'double precision', nullable: true })
  heading: number | null;

  /**
   * GPS accuracy (meters) - optional but useful for filtering bad points
   */
  @Column({ type: 'double precision', nullable: true })
  accuracy: number | null;

  /**
   * Real point time from device (important for offline sync).
   * Made nullable for backward compatibility with current DTO/API.
   * (We will later enforce it in DTO/validation.)
   */
  @Column({ type: 'timestamptz', nullable: true })
  timestamp: Date | null;

  /**
   * Server insert time
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}