import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }

  async login(user: User): Promise<{ cookie: string }> {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    
    // Para desarrollo local (HTTP) se requiere SameSite=Lax.
    // Para producción cross-domain (HTTPS Vercel -> HTTPS Cloud Run),
    // el navegador bloquea la cookie SI NO tiene SameSite=None y Secure.
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
    const sameSite = isProd ? 'None' : 'Lax';
    const secure = isProd ? '; Secure' : '';
    
    const cookie = `Authentication=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=${sameSite}${secure}`;
    
    return { cookie };
  }
}
