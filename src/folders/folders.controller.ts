import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
    description: 'If true – include archived folders',
  })
  getFolders(@Query('all') all = 'false') {
    return this.service.getFolders(all === 'true');
  }

  @Post()
  create(@Body() body: CreateFolderDto) {
    return this.service.createFolder(body.name);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.setArchived(Number(id), true);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.service.setArchived(Number(id), false);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteFolderDeep(Number(id));
  }
}
