import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Post('folders/:folderId/projects')
  createProject(@Param('folderId', ParseIntPipe) folderId: number, @Body() body: { name: string }) {
    return this.service.createProject(folderId, body.name);
  }

  @Get('projects/:id/kml-layers')
  getProjectKml(@Param('id', ParseIntPipe) projectId: number) {
    return this.service.getProjectKmlLayers(projectId);
  }

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

  @Patch('projects/:id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @Patch('projects/:id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @Delete('projects/:id')
  async deleteProjectDeep(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteProjectDeep(id);
    return { ok: true, deletedId: id };
  }
}
