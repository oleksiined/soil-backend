import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MapNote } from './entities/map-note.entity';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(MapNote) private readonly notes: Repository<MapNote>) {}

  async create(userId: number, dto: any) {
    const n = this.notes.create({
      userId,
      projectId: dto.projectId ?? null,
      lat: dto.lat,
      lng: dto.lng,
      text: String(dto.text || ''),
      updated_at: null,
    });
    return this.notes.save(n);
  }

  async list(projectId?: number) {
    if (projectId != null) {
      return this.notes.find({ where: { projectId }, order: { id: 'ASC' } });
    }
    return this.notes.find({ order: { id: 'ASC' } });
  }

  async update(userId: number, id: number, dto: any) {
    const n = await this.notes.findOne({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException('Note not found');

    if (dto.text != null) n.text = String(dto.text);
    n.updated_at = new Date();
    return this.notes.save(n);
  }

  async remove(userId: number, id: number) {
    const n = await this.notes.findOne({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException('Note not found');
    await this.notes.remove(n);
    return { ok: true, deletedId: id };
  }
}
