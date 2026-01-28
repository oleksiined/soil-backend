import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { KmlLayer } from './kml-layer.entity';

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'folder_id', type: 'int', nullable: true })
  folderId: number | null;

  @ManyToOne(() => Folder, (f) => f.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => KmlLayer, (k) => k.project)
  kmlLayers: KmlLayer[];
}
