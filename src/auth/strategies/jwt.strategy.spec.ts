import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret_key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('debería retornar el usuario si existe en base de datos al validar el payload', async () => {
      const expectedUser = { id: 'uuid-123', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(expectedUser);

      const result = await strategy.validate({ sub: 'uuid-123' });

      expect(mockUsersService.findById).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(expectedUser);
    });

    it('debería lanzar UnauthorizedException si el usuario referenciado en el token no existe', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'uuid-missing' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
