import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';

@ApiTags('Folders')
@Controller('folders')
export class FoldersController {
  constructor(private readonly service: FoldersService) {}

  @Get()
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
  })
  getFolders(@Query('all') all = 'false') {
    return this.service.getFolders(all === 'true');
  }

  @Post()
  create(@Body() body: CreateFolderDto) {
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
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteFolderDeep(id);
  }
}
