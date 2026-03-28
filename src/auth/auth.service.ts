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
    
    // For local development on HTTP, we cannot use Secure, and Lax is fine because they share localhost (albeit different ports)
    // In production, this should be SameSite=None; Secure if API is on a different domain
    const cookie = `Authentication=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`;
    
    return { cookie };
  }
}
