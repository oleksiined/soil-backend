import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class DevSeedService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async onModuleInit() {
    const username = String(process.env.ADMIN_USERNAME || 'admin').trim();
    const password = String(process.env.ADMIN_PASSWORD || 'admin123');

    if (!username || !password) return;

    const exists = await this.users.findOne({ where: { username } });
    if (exists) return;

    const passwordHash = await bcrypt.hash(password, 10);

    await this.users.save(
      this.users.create({
        username,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      }),
    );
  }
}
