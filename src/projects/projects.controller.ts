import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('folder/:folderId')
  @ApiOperation({ summary: 'Create project in folder' })
  create(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(folderId, dto);
  }

  @Get('folder/:folderId')
  @ApiOperation({ summary: 'Get projects by folder' })
  getByFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.projectsService.getByFolder(folderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.delete(id);
  }
}
