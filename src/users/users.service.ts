import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll() {
    return this.users.find();
  }

  async findByUsername(username: string) {
    return this.users.findOne({ where: { username } });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.users.create({
      username: dto.username,
      password: hash,
      role: dto.role,
    });

    return this.users.save(user);
  }
}
