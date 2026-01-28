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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { FolderDto } from './dto/folder.dto';
import { CreateFolderDto } from './dto/create-folder.dto';

@ApiTags('folders')
@Controller('folders')
export class FoldersController {
  constructor(private readonly service: FoldersService) {}

  @ApiOkResponse({ type: [FolderDto] })
  @Get()
  getFolders(@Query('includeArchived') includeArchived?: string) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.service.getFolders(flag);
  }

  @ApiOkResponse({ type: FolderDto })
  @Post()
  createFolder(@Body() body: CreateFolderDto) {
    return this.service.createFolder(body.name);
  }

  @ApiOkResponse({ type: FolderDto })
  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @ApiOkResponse({ type: FolderDto })
  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @ApiOkResponse({ schema: { example: { ok: true, deletedId: 123 } } })
  @Delete(':id')
  async deleteDeep(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteFolderDeep(id);
    return { ok: true, deletedId: id };
  }
}
