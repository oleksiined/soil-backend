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
  speed: number;

  @Column({ type: 'double precision', nullable: true })
  heading: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  geom: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}