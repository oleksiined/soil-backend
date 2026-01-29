import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MapNote } from './entities/map-note.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([MapNote])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
