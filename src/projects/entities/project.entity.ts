import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { KmlLayer } from '../../kml-layers/entities/kml-layer.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folderId: number;

  @ManyToOne(() => Folder, (f) => f.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @Column({ type: 'text' })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => KmlLayer, (k) => k.project)
  kmlLayers: KmlLayer[];
}
