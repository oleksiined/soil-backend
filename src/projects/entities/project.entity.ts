import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FolderEntity } from '../../folders/entities/folder.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { KmlLayerEntity } from '../../kml-layers/entities/kml-layer.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => FolderEntity, (folder) => folder.projects, {
    onDelete: 'CASCADE',
  })
  folder: FolderEntity;

  @OneToMany(() => Mission, (mission) => mission.project)
  missions: Mission[];

  @OneToMany(() => KmlLayerEntity, (kml) => kml.project)
  kmlLayers: KmlLayerEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
