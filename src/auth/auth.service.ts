import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, refreshHash);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user.refreshTokenHash)
      throw new UnauthorizedException('Invalid refresh token');

    const match = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!match) throw new UnauthorizedException('Invalid refresh token');

    const newPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(newPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const newRefreshToken = await this.jwt.signAsync(newPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    const newHash = await bcrypt.hash(newRefreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, newHash);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(userId: number) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { ok: true };
  }
}
