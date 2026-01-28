import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

import { ProjectsService } from './projects.service';

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

@Controller()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  // create project
  @Post('folders/:folderId/projects')
  createProject(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() body: { name: string },
  ) {
    return this.service.createProject(folderId, body.name);
  }

  // list KML layers for project
  @Get('projects/:id/kml-layers')
  getProjectKml(@Param('id', ParseIntPipe) projectId: number) {
    return this.service.getProjectKmlLayers(projectId);
  }

  // upload KML layer to project  ✅ ОЦЕ ТЕ, ЧОГО НЕ ВИСТАЧАЛО
  @Post('projects/:id/kml-layers')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), 'uploads', 'kml');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const stamp = Date.now();
          const base = safeName(file.originalname || 'file.kml');
          cb(null, `${stamp}_${base}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadKml(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() body: { type?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.uploadProjectKml(projectId, body?.type, file);
  }

  // archive/unarchive/delete project
  @Patch('projects/:id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch('projects/:id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete('projects/:id')
  deleteProjectDeep(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteProjectDeep(id);
  }
}
