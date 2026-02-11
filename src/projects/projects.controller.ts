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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('folder/:folderId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create project in folder' })
  create(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(folderId, dto);
  }

  @Get('folder/:folderId')
  @ApiOperation({ summary: 'Get projects by folder' })
  getByFolder(@Param('folderId', ParseIntPipe) folderId: number) {
    return this.projectsService.getByFolder(folderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getById(id);
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive project' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unarchive project' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.setArchived(id, false);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete project' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.delete(id);
  }
}
