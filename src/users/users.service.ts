import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async listUsers() {
    const rows = await this.users.find({ order: { id: 'ASC' } });
    return rows.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      created_at: u.created_at.toISOString(),
    }));
  }

  async createUser(usernameRaw: string, passwordRaw: string, roleRaw?: string) {
    const username = String(usernameRaw || '').trim();
    const password = String(passwordRaw || '');

    if (!username) throw new BadRequestException('Username is required');
    if (username.length < 3) throw new BadRequestException('Username is too short');
    if (!password || password.length < 6) throw new BadRequestException('Password is too short');

    const role = roleRaw === 'ADMIN' ? 'ADMIN' : 'DRIVER';

    const exists = await this.users.findOne({ where: { username } });
    if (exists) throw new BadRequestException('Username already exists');

    const passwordHash = await bcrypt.hash(password, 10);

    const u = await this.users.save(
      this.users.create({
        username,
        passwordHash,
        role,
        isActive: true,
      }),
    );

    return {
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      created_at: u.created_at.toISOString(),
    };
  }

  async setActive(id: number, isActive: boolean) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    u.isActive = !!isActive;
    const saved = await this.users.save(u);
    return {
      id: saved.id,
      username: saved.username,
      role: saved.role,
      isActive: saved.isActive,
      created_at: saved.created_at.toISOString(),
    };
  }

  async setPassword(id: number, passwordRaw: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');

    const password = String(passwordRaw || '');
    if (!password || password.length < 6) throw new BadRequestException('Password is too short');

    u.passwordHash = await bcrypt.hash(password, 10);
    await this.users.save(u);
    return { ok: true };
  }
}
