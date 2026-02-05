import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive project' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive project' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.setArchived(id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.delete(id);
  }
}
