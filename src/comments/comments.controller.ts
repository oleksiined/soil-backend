import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  ParseFloatPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const photoUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB на фото
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Дозволені тільки фото (jpeg/png/webp/heic)'), false);
    }
  },
};

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  // ─────────────────────────────────────────────
  // Створити коментар (з фото або без)
  // ─────────────────────────────────────────────

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 5, photoUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lat', 'lng', 'problem'],
      properties: {
        lat: { type: 'number', example: 50.4867 },
        lng: { type: 'number', example: 28.4915 },
        problem: { type: 'string', example: 'Перезволожена ділянка' },
        fieldName: { type: 'string', example: 'GreenLand_65' },
        kmlPointId: { type: 'string', example: 'GreenLand_point.3' },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'До 5 фото',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Залишити коментар на карті (з фото)' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateCommentDto,
    @UploadedFiles() photos: Express.Multer.File[],
    @Request() req: any,
  ) {
    return this.service.create(projectId, req.user.sub, dto, photos ?? []);
  }

  // ─────────────────────────────────────────────
  // Список коментарів проєкту
  // ─────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Всі коментарі проєкту' })
  getByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getByProject(projectId);
  }

  // ─────────────────────────────────────────────
  // Коментарі поблизу (для навігації на телефоні)
  // ─────────────────────────────────────────────

  @Get('nearby')
  @ApiOperation({
    summary: 'Коментарі в радіусі від поточної позиції',
    description: 'Повертає коментарі в радіусі radiusMeters від точки lat/lng',
  })
  @ApiQuery({ name: 'lat', type: Number, example: 50.4867 })
  @ApiQuery({ name: 'lng', type: Number, example: 28.4915 })
  @ApiQuery({ name: 'radius', type: Number, example: 500, description: 'Радіус в метрах' })
  getNearby(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusMeters: number,
  ) {
    return this.service.getNearby(projectId, lat, lng, radiusMeters);
  }

  // ─────────────────────────────────────────────
  // Один коментар
  // ─────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Деталі коментаря' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOne(id);
  }

  // ─────────────────────────────────────────────
  // Оновити коментар + додати фото
  // ─────────────────────────────────────────────

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('photos', 5, photoUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        problem: { type: 'string' },
        fieldName: { type: 'string' },
        kmlPointId: { type: 'string' },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Нові фото (додаються до існуючих)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Оновити свій коментар (тільки власник або Admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @UploadedFiles() photos: Express.Multer.File[],
    @Request() req: any,
  ) {
    return this.service.update(id, req.user.sub, req.user.role, dto, photos ?? []);
  }

  // ─────────────────────────────────────────────
  // Видалити одне фото з коментаря
  // ─────────────────────────────────────────────

  @Delete(':id/photos')
  @ApiOperation({
    summary: 'Видалити фото з коментаря',
    description: 'Передай photoPath — шлях фото який прийшов у відповіді',
  })
  @ApiQuery({ name: 'photoPath', type: String, example: 'uploads/comments/123_abc.jpg' })
  removePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Query('photoPath') photoPath: string,
    @Request() req: any,
  ) {
    return this.service.removePhoto(id, req.user.sub, req.user.role, photoPath);
  }

  // ─────────────────────────────────────────────
  // Видалити коментар
  // ─────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити коментар (тільки власник або Admin)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.delete(id, req.user.sub, req.user.role);
  }
}
