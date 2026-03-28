import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;
  let mockResponse: any;

  beforeEach(async () => {
    mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };
    mockResponse = {
      setHeader: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('debería retornar el usuario y setear la cookie', async () => {
      const user = { id: '1', email: 't@t.com', fullName: 'Test' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({ cookie: 'Authentication=token' });

      const result = await controller.login({ email: 't@t.com', password: '1' }, mockResponse);
      expect(result.id).toBe('1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', 'Authentication=token');
    });
  });

  describe('me', () => {
    it('debería retornar los datos del usuario en el request', async () => {
      const mockReq = { user: { id: '1', email: 't@t.com' } };
      const result = await controller.getProfile(mockReq);
      expect(result).toEqual(mockReq.user);
    });
  });
});
