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

  // ─── Автоматичне підсвічування ───
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

  // ─── Ручне підтвердження ───

  /**
   * null  = не задіяно вручну (працює тільки автологіка)
   * true  = вручну ПІДТВЕРДЖЕНО (навіть якщо автологіка ще не спрацювала)
   * false = вручну СКАСОВАНО (навіть якщо автологіка вже підсвітила)
   */
  @Column({ name: 'manual_override', type: 'boolean', nullable: true, default: null })
  manualOverride: boolean | null;

  /** Хто зробив ручну зміну */
  @Column({ name: 'override_by_user_id', type: 'int', nullable: true, default: null })
  overrideByUserId: number | null;

  /** Коли зробили ручну зміну */
  @Column({ name: 'override_at', type: 'timestamptz', nullable: true, default: null })
  overrideAt: Date | null;

  /** Причина/коментар до ручної зміни */
  @Column({ name: 'override_note', type: 'text', nullable: true, default: null })
  overrideNote: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Фінальний статус — враховує і авто і ручне підтвердження.
   * Якщо manualOverride != null — воно має пріоритет.
   */
  get effectiveSampled(): boolean {
    if (this.manualOverride !== null && this.manualOverride !== undefined) {
      return this.manualOverride;
    }
    return this.isSampled;
  }
}
