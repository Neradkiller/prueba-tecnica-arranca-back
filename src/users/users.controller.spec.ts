import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: any;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('register', () => {
    it('debería registrar un usuario correctamente', async () => {
      const dto = { email: 'test@t.com', password: '123', fullName: 'Test' };
      mockUsersService.create.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.register(dto);
      expect(result.id).toBe('1');
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });
});
