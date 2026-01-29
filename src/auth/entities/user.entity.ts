import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type UserRole = 'ADMIN' | 'DRIVER';

@Entity({ name: 'users' })
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ type: 'text', default: 'DRIVER' })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
