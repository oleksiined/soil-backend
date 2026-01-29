import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('map-notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @ApiOkResponse({ schema: { example: { id: 1, text: '...' } } })
  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateNoteDto) {
    return this.service.create(user.id, body);
  }

  @ApiOkResponse({ schema: { example: [{ id: 1 }, { id: 2 }] } })
  @Get()
  list(@Query('projectId') projectId?: string) {
    const pid = projectId != null ? Number(projectId) : undefined;
    return this.service.list(Number.isFinite(pid as any) ? (pid as any) : undefined);
  }

  @ApiOkResponse({ schema: { example: { id: 1, text: 'updated' } } })
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
  ) {
    return this.service.update(user.id, id, body);
  }

  @ApiOkResponse({ schema: { example: { ok: true, deletedId: 1 } } })
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }
}
