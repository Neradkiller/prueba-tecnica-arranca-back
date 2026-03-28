import { Controller, Post, Body, Res, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCookieAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { User } from '../users/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ auth: { limit: 5, ttl: 300000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener cookie HttpOnly' })
  @ApiOkResponse({ description: 'Login exitoso y cookie seteada.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const { cookie } = await this.authService.login(user);
    response.setHeader('Set-Cookie', cookie);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('Authentication')
  @ApiOperation({ summary: 'Cerrar sesión (Eliminar cookie)' })
  @ApiOkResponse({ description: 'Sesión cerrada exitosamente.' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Set-Cookie', 'Authentication=; HttpOnly; Path=/; Max-Age=0');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('Authentication')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
