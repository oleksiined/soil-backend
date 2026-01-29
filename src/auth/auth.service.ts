import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

function parseTtlToSeconds(raw: string | undefined, fallbackSeconds: number): number {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return fallbackSeconds;
  if (/^\d+$/.test(s)) return Math.max(1, Number(s));
  const m = s.match(/^(\d+)\s*([smhdw])$/);
  if (!m) return fallbackSeconds;

  const n = Number(m[1]);
  const unit = m[2];
  const mult =
    unit === 's' ? 1 :
    unit === 'm' ? 60 :
    unit === 'h' ? 60 * 60 :
    unit === 'd' ? 60 * 60 * 24 :
    unit === 'w' ? 60 * 60 * 24 * 7 :
    1;

  return Math.max(1, n * mult);
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}

  private accessSecret() {
    return process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  }

  private refreshSecret() {
    return process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  }

  private accessTtlSeconds() {
    return parseTtlToSeconds(process.env.JWT_ACCESS_TTL, 15 * 60);
  }

  private refreshTtlSeconds() {
    return parseTtlToSeconds(process.env.JWT_REFRESH_TTL, 30 * 24 * 60 * 60);
  }

  private signAccess(user: User) {
    return this.jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      { secret: this.accessSecret(), expiresIn: this.accessTtlSeconds() },
    );
  }

  private signRefresh(user: User) {
    return this.jwt.sign(
      { sub: user.id, type: 'refresh' },
      { secret: this.refreshSecret(), expiresIn: this.refreshTtlSeconds() },
    );
  }

  private toUserDto(user: User) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async register(usernameRaw: string, passwordRaw: string) {
    const username = String(usernameRaw || '').trim();
    const password = String(passwordRaw || '');

    if (!username) throw new BadRequestException('Username is required');
    if (username.length < 3) throw new BadRequestException('Username is too short');
    if (!password || password.length < 6) throw new BadRequestException('Password is too short');

    const exists = await this.users.findOne({ where: { username } });
    if (exists) throw new BadRequestException('Username already exists');

    const passwordHash = await bcrypt.hash(password, 10);

    const u = await this.users.save(
      this.users.create({
        username,
        passwordHash,
        role: 'DRIVER',
        isActive: false,
      }),
    );

    return { user: this.toUserDto(u) };
  }

  async login(username: string, password: string, deviceId?: string) {
    const u = await this.users.findOne({ where: { username } });
    if (!u || !u.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.signAccess(u);
    const refreshToken = this.signRefresh(u);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds() * 1000);

    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: u.id,
        tokenHash,
        deviceId: deviceId ? String(deviceId) : null,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken, user: this.toUserDto(u) };
  }

  async refresh(refreshToken: string, deviceId?: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, { secret: this.refreshSecret() });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload || payload.type !== 'refresh') throw new UnauthorizedException('Invalid token');

    const u = await this.users.findOne({ where: { id: payload.sub } });
    if (!u || !u.isActive) throw new UnauthorizedException('Invalid token');

    const tokens = await this.refreshRepo.find({ where: { userId: u.id } });

    let found = false;
    for (const t of tokens) {
      const match = await bcrypt.compare(refreshToken, t.tokenHash);
      if (!match) continue;

      if (t.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Expired token');
      if (t.deviceId && deviceId && t.deviceId !== String(deviceId)) {
        throw new UnauthorizedException('Invalid token');
      }

      found = true;
      break;
    }

    if (!found) throw new UnauthorizedException('Invalid token');

    const accessToken = this.signAccess(u);
    return { accessToken, user: this.toUserDto(u) };
  }

  async me(userId: number) {
    const u = await this.users.findOne({ where: { id: userId } });
    if (!u || !u.isActive) throw new UnauthorizedException('Unauthorized');
    return this.toUserDto(u);
  }
}
