import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.repo.find({
      select: ['id', 'username', 'role'],
      order: { id: 'ASC' },
    });
  }

  async findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  async findById(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.repo.create({
      username: dto.username,
      password: hash,
      role: dto.role ?? UserRole.USER,
    });

    return this.repo.save(user);
  }

  async setRefreshTokenHash(userId: number, refreshTokenHash: string | null) {
    await this.repo.update(userId, { refreshTokenHash });
    return true;
  }

  async deleteAll() {
    await this.repo.clear();
    return true;
  }
}
