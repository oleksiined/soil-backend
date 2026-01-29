import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash: string;

  @Column({ name: 'device_id', type: 'text', nullable: true })
  deviceId: string | null;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
