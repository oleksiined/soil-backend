import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
