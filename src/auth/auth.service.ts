import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(dto: LoginDto) {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new UnauthorizedException('Admin credentials are not configured');
    }

    if (dto.username !== adminUsername || dto.password !== adminPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: 0,
      username: dto.username,
      role: 'ADMIN',
    };

    const accessTtlSec = this.parseTtlToSeconds(process.env.JWT_ACCESS_TTL ?? '15m');
    const refreshTtlSec = this.parseTtlToSeconds(process.env.JWT_REFRESH_TTL ?? '30d');

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessTtlSec,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshTtlSec,
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: accessTtlSec,
    };
  }

  async refresh(dto: RefreshDto) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new UnauthorizedException('Refresh secret is not configured');
    }

    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessTtlSec = this.parseTtlToSeconds(process.env.JWT_ACCESS_TTL ?? '15m');

    const accessToken = await this.jwt.signAsync(
      {
        sub: payload.sub,
        username: payload.username,
        role: payload.role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessTtlSec,
      },
    );

    return {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: accessTtlSec,
    };
  }

  private parseTtlToSeconds(value: string): number {
    const v = value.trim().toLowerCase();

    const m = v.match(/^(\d+)(s|m|h|d)$/);
    if (!m) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return Math.floor(n);
      return 900;
    }

    const num = Number(m[1]);
    const unit = m[2];

    if (!Number.isFinite(num) || num <= 0) return 900;

    if (unit === 's') return num;
    if (unit === 'm') return num * 60;
    if (unit === 'h') return num * 60 * 60;
    return num * 60 * 60 * 24;
  }
}
