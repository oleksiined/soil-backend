import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KmlLayersService } from './kml-layers.service';

@Controller('kml-layers')
export class KmlLayersController {
  constructor(private readonly kmlLayersService: KmlLayersService) {}

  // multipart/form-data:
  // - file: .kml
  // - projectId: number
  // - type: field | tracks | points | zones
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { projectId?: string | number; type?: string },
  ) {
    if (!file) throw new BadRequestException('file is required');

    const projectIdNum = Number(body.projectId);
    if (!projectIdNum || Number.isNaN(projectIdNum)) {
      throw new BadRequestException('projectId must be a number');
    }

    if (!body.type) throw new BadRequestException('type is required');

    return this.kmlLayersService.upload({
      projectId: projectIdNum,
      type: body.type,
      file,
    });
  }

  @Get()
  findAll() {
    return this.kmlLayersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kmlLayersService.findOne(Number(id));
  }
}
