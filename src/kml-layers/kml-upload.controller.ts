import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { KmlUploadService } from './kml-upload.service';
import type { KmlFileType } from './entities/kml-file.entity';

const KML_MIME_TYPES = [
  'application/vnd.google-earth.kml+xml',
  'application/xml',
  'text/xml',
  'text/plain',
  'application/octet-stream',
];

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const isKml =
      file.originalname.toLowerCase().endsWith('.kml') ||
      KML_MIME_TYPES.includes(file.mimetype);
    if (!isKml) {
      cb(new BadRequestException('Дозволені тільки KML файли'), false);
    } else {
      cb(null, true);
    }
  },
};

@ApiTags('KML Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/kml')
export class KmlUploadController {
  constructor(private readonly uploadService: KmlUploadService) {}

  // ─────────────────────────────────────────────
  // Upload одного файлу
  // ─────────────────────────────────────────────

  @Post('upload')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'KML файл' },
        type: {
          type: 'string',
          enum: ['contour', 'track', 'point', 'centroid'],
          description: 'Тип KML (необов\'язково — визначається автоматично)',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Завантажити один KML файл',
    description:
      'Тип визначається автоматично за назвою файлу або вмістом. ' +
      'Для contour-файлів автоматично створюються записи в kml_layers з PostGIS геометрією.',
  })
  async uploadOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') typeOverride?: KmlFileType,
  ) {
    if (!file) throw new BadRequestException('Файл не завантажено');

    const content = file.buffer.toString('utf-8');
    return this.uploadService.uploadOne(projectId, file.originalname, content, typeOverride);
  }

  // ─────────────────────────────────────────────
  // Batch upload (до 4 файлів одразу)
  // ─────────────────────────────────────────────

  @Post('upload-batch')
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('files', 4, multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'До 4 KML файлів: contour, track, point, centroid',
        },
      },
      required: ['files'],
    },
  })
  @ApiOperation({
    summary: 'Завантажити всі 4 KML файли одночасно',
    description:
      'Завантажує всі 4 типи KML файлів для проєкту. ' +
      'Рекомендовано завантажувати одним запитом для коректної синхронізації.',
  })
  async uploadBatch(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('Файли не завантажено');

    const input = files.map((f) => ({
      originalName: f.originalname,
      content: f.buffer.toString('utf-8'),
    }));

    return this.uploadService.uploadBatch(projectId, input);
  }

  // ─────────────────────────────────────────────
  // Список KML файлів проєкту
  // ─────────────────────────────────────────────

  @Get()
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['contour', 'track', 'point', 'centroid'],
    description: 'Фільтр по типу',
  })
  @ApiOperation({ summary: 'Список KML файлів проєкту' })
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('type') type?: KmlFileType,
  ) {
    return this.uploadService.getByProject(projectId, type);
  }

  // ─────────────────────────────────────────────
  // Деталі одного файлу (з placemarks)
  // ─────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Деталі KML файлу з розпарсеними об\'єктами' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.getOne(id);
  }

  // ─────────────────────────────────────────────
  // Скачати оригінальний KML
  // ─────────────────────────────────────────────

  @Get(':id/download')
  @ApiOperation({ summary: 'Скачати оригінальний KML файл' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { filename, content } = await this.uploadService.getRawContent(id);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  // ─────────────────────────────────────────────
  // Архівувати / Видалити
  // ─────────────────────────────────────────────

  @Patch(':id/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Архівувати KML файл' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.archive(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Видалити KML файл' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.delete(id);
  }
}
