import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepo.find({
      order: { id: 'ASC' },
      select: ['id', 'username', 'role', 'isActive'],
    });
  }

  async setActive(id: number, isActive: boolean) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = isActive;
    await this.usersRepo.save(user);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
