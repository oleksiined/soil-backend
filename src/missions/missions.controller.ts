import { Body, Controller, Get, Post } from '@nestjs/common';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  create(@Body() body: { name?: string }) {
    return this.missionsService.create(body);
  }

  @Get()
  findAll() {
    return this.missionsService.findAll();
  }
}
