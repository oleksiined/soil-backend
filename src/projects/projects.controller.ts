import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() body: CreateProjectDto) {
    return this.projectsService.create(body);
  }

  // GET /projects?includeArchived=1
  @Get()
  findAll(@Query('includeArchived') includeArchived?: string) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.projectsService.findAll(flag);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
    return this.projectsService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(Number(id));
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.projectsService.archive(Number(id));
  }

  @Post(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.projectsService.unarchive(Number(id));
  }

  @Get(':id/kml-layers')
  async kmlLayers(@Param('id') id: string) {
    const project = await this.projectsService.getKmlLayers(Number(id));
    if (!project) throw new NotFoundException('Project not found');
    return project.kmlLayers;
  }
}
