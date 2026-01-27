import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Body() body: CreateFolderDto) {
    return this.foldersService.create(body);
  }

  // GET /folders?includeArchived=1
  @Get()
  findAll(@Query('includeArchived') includeArchived?: string) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.foldersService.findAll(flag);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateFolderDto) {
    return this.foldersService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.remove(Number(id));
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.foldersService.archive(Number(id));
  }

  @Post(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.foldersService.unarchive(Number(id));
  }
}
