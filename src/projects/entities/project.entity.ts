import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { FolderEntity } from '../../folders/entities/folder.entity';
import { KmlLayerEntity } from '../../kml-layers/entities/kml-layer.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => FolderEntity, (folder) => folder.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: FolderEntity;

  @OneToMany(() => KmlLayerEntity, (layer) => layer.project)
  kmlLayers: KmlLayerEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
