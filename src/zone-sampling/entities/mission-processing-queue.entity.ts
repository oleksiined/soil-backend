import { Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('mission_processing_queue')
export class MissionProcessingQueue {
  @PrimaryColumn({ name: 'mission_id' })
  missionId: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}