import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SamplingService } from './sampling.service';
import { CreateSamplingPointDto } from './dto/create-sampling-point.dto';
import { MarkDoneDto } from './dto/mark-done.dto';

@ApiTags('sampling')
@ApiBearerAuth()
@Controller('sampling-points')
export class SamplingController {
  constructor(private readonly service: SamplingService) {}

  @ApiOkResponse({ schema: { example: { id: 1, projectId: 7, isDone: false } } })
  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateSamplingPointDto) {
    return this.service.create(user.id, body);
  }

  @ApiOkResponse({ schema: { example: [{ id: 1 }, { id: 2 }] } })
  @Get()
  list(@Query('projectId', ParseIntPipe) projectId: number) {
    return this.service.list(projectId);
  }

  @ApiOkResponse({ schema: { example: { id: 1, isDone: true, doneType: 'AUTO' } } })
  @Patch(':id/done')
  done(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MarkDoneDto,
  ) {
    return this.service.markDone(user.id, id, body.doneType);
  }

  @ApiOkResponse({ schema: { example: { id: 1, isDone: false } } })
  @Patch(':id/undone')
  undone(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.undo(user.id, id);
  }
}
