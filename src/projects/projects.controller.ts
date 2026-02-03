import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post('folder/:folderId')
  create(
    @Param('folderId') folderId: number,
    @Body() body: { name: string },
  ) {
    return this.service.createProject(body.name, Number(folderId));
  }

  @Get(':id')
  getDetails(@Param('id') id: number) {
    return this.service.getProjectDetails(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.deleteProjectDeep(Number(id));
  }
}
