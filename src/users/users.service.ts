import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll() {
    return this.users.find({ order: { id: 'ASC' } });
  }

  async create(dto: CreateUserDto) {
    const username = String(dto.username || '').trim();
    const password = String(dto.password || '').trim();

    if (!username) throw new BadRequestException('username is required');
    if (!password) throw new BadRequestException('password is required');

    const existing = await this.users.findOne({ where: { username } });
    if (existing) throw new BadRequestException('username already exists');

    const user = this.users.create({
      username,
      password,
      role: dto.role,
      isActive: true,
    });

    return this.users.save(user);
  }
}
