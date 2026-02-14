import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const username = 'SamplayerAdmin';
    const password = 'Samplayer2026*';

    const existing = await this.usersService.findByUsername(username);

    if (!existing) {
      await this.usersService.create({
        username,
        password,
        role: UserRole.ADMIN,
      });

      // eslint-disable-next-line no-console
      console.log(`[AdminSeeder] Admin created: ${username}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[AdminSeeder] Admin already exists: ${username}`);
    }
  }
}
