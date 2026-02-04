import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('folder/:folderId')
  @ApiOperation({ summary: 'Create project in folder' })
  @ApiParam({ name: 'folderId', type: Number, required: true })
  @ApiBody({ type: CreateProjectDto, required: true })
  create(
    @Param('folderId') folderId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(folderId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiParam({ name: 'id', type: Number, required: true })
  getById(@Param('id') id: number) {
    return this.projectsService.getById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiParam({ name: 'id', type: Number, required: true })
  delete(@Param('id') id: number) {
    return this.projectsService.delete(id);
  }
}
