import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { ProjectDto } from './dto/project.dto';
import { KmlLayerDto } from './dto/kml-layer.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UploadKmlDto } from './dto/upload-kml.dto';
import { ProjectDetailsDto } from './dto/project-details.dto';
import { ProjectsSyncDto } from './dto/projects-sync.dto';
import { SyncV2Dto } from './dto/sync-v2.dto';

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

@ApiTags('projects')
@Controller()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @ApiOkResponse({ type: ProjectsSyncDto })
  @ApiQuery({
    name: 'sinceProjectId',
    required: true,
    description: 'Return projects with id > sinceProjectId (default 0)',
    schema: { type: 'number' },
  })
  @ApiQuery({
    name: 'sinceLayerId',
    required: true,
    description: 'Return kml layers with id > sinceLayerId (default 0)',
    schema: { type: 'number' },
  })
  @Get('sync/projects')
  syncProjects(
    @Query('sinceProjectId') sinceProjectId?: string,
    @Query('sinceLayerId') sinceLayerId?: string,
  ) {
    const p = Number(sinceProjectId ?? '0');
    const l = Number(sinceLayerId ?? '0');
    return this.service.syncProjectsSinceId(Number.isFinite(p) ? p : 0, Number.isFinite(l) ? l : 0);
  }

  @ApiOkResponse({ type: SyncV2Dto })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'ISO datetime. If omitted/invalid -> defaults to 2000-01-01T00:00:00.000Z',
    schema: { type: 'string' },
  })
  @Get('sync/v2')
  syncV2(@Query('since') since?: string) {
    const fallback = new Date('2000-01-01T00:00:00.000Z');

    if (!since || !String(since).trim()) {
      return this.service.syncV2Since(fallback);
    }

    const d = new Date(String(since));
    if (Number.isNaN(d.getTime())) {
      return this.service.syncV2Since(fallback);
    }

    return this.service.syncV2Since(d);
  }

  @ApiOkResponse({ type: ProjectDto })
  @ApiBody({ type: CreateProjectDto })
  @Post('folders/:folderId/projects')
  createProject(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() body: CreateProjectDto,
  ) {
    return this.service.createProject(folderId, body.name);
  }

  @ApiOkResponse({ type: ProjectDetailsDto })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    schema: { type: 'string', example: 'false' },
  })
  @Get('projects/:id')
  getProjectDetails(
    @Param('id', ParseIntPipe) projectId: number,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.service.getProjectDetails(projectId, flag);
  }

  @ApiOkResponse({ type: [KmlLayerDto] })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    schema: { type: 'string', example: 'false' },
  })
  @Get('projects/:id/kml-layers')
  getProjectKml(
    @Param('id', ParseIntPipe) projectId: number,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const flag = includeArchived === '1' || includeArchived === 'true';
    return this.service.getProjectKmlLayers(projectId, flag);
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
