import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ default: 'new' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
