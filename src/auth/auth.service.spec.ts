import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('debería retornar el usuario si las credenciales son válidas', async () => {
      const user = { id: 'uuid-123', email: 'test@t.com', passwordHash: 'hashed' } as User;
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@t.com', 'pass');
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('debería generar una cookie', async () => {
      const user = { id: '1', email: 't@t.com' } as User;
      mockJwtService.sign.mockReturnValue('token');
      const result = await service.login(user);
      expect(result.cookie).toContain('Authentication=token');
    });
  });
});
