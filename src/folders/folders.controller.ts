import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController {
  constructor(private readonly service: FoldersService) {}

  @Get()
  getFolders(@Query('includeArchived') includeArchived?: string) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.service.getFolders(flag);
  }

  @Post()
  createFolder(@Body() body: { name: string }) {
    return this.service.createFolder(body.name);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete(':id')
  async deleteDeep(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteFolderDeep(id);
    return { ok: true, deletedId: id };
  }
}
