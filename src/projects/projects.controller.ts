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
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { ProjectDto } from './dto/project.dto';
import { KmlLayerDto } from './dto/kml-layer.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UploadKmlDto } from './dto/upload-kml.dto';

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

@ApiTags('projects')
@Controller()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @ApiOkResponse({ type: ProjectDto })
  @ApiBody({ type: CreateProjectDto })
  @Post('folders/:folderId/projects')
  createProject(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() body: CreateProjectDto,
  ) {
    return this.service.createProject(folderId, body.name);
  }

  @ApiOkResponse({ type: [KmlLayerDto] })
  @Get('projects/:id/kml-layers')
  getProjectKml(@Param('id', ParseIntPipe) projectId: number) {
    return this.service.getProjectKmlLayers(projectId);
  }

  @ApiOkResponse({ type: KmlLayerDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['track', 'points', 'centroid', 'zones'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
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
    @Body() body: UploadKmlDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.uploadProjectKml(projectId, body?.type, file);
  }

  @ApiOkResponse({ type: ProjectDto })
  @Patch('projects/:id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, true);
  }

  @ApiOkResponse({ type: ProjectDto })
  @Patch('projects/:id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.service.setArchived(id, false);
  }

  @ApiOkResponse({ schema: { example: { ok: true, deletedId: 123 } } })
  @Delete('projects/:id')
  async deleteProjectDeep(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteProjectDeep(id);
    return { ok: true, deletedId: id };
  }
}
