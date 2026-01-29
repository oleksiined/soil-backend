import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @ApiOkResponse({
    schema: { example: { user: { id: 1, username: 'driver1', role: 'DRIVER', isActive: false } } },
  })
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.service.register(body.username, body.password);
  }

  @Public()
  @ApiOkResponse({ type: AuthResponseDto })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.service.login(body.username, body.password, body.deviceId);
  }

  @Public()
  @ApiOkResponse({
    schema: {
      example: { accessToken: '...', user: { id: 1, username: 'driver1', role: 'DRIVER', isActive: true } },
    },
  })
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.service.refresh(body.refreshToken, body.deviceId);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    schema: { example: { id: 1, username: 'driver1', role: 'DRIVER', isActive: true } },
  })
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.id);
  }
}
