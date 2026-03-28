import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @Throttle({ short: { limit: 1, ttl: 60000 } }) // Solo 1 registro por minuto
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Email ya registrado.' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
