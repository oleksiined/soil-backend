import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Track } from './track.entity';

@Entity({ name: 'track_points' })
export class TrackPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'track_id', type: 'int' })
  trackId: number;

  @ManyToOne(() => Track, (t) => t.points, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'double precision', nullable: true })
  accuracy: number | null;

  @Column({ type: 'double precision', nullable: true })
  speed: number | null;

  @Column({ type: 'double precision', nullable: true })
  heading: number | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
