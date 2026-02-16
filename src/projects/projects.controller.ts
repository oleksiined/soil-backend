import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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
    return this.projectsService.create(folderId, dto.name);
  }

  @Get('folder/:folderId')
  @ApiOperation({ summary: 'Get projects by folder' })
  findByFolder(@Param('folderId', ParseIntPipe) folderId: number) {
    return this.projectsService.findByFolder(folderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive project' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.archive(id);
  }

  @Patch(':id/unarchive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unarchive project' })
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.unarchive(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete project' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.delete(id);
  }
}
