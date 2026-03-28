import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let mockTasksService: any;

  beforeEach(async () => {
    mockTasksService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debería llamar a service.findAll con el userId del request y paginación', async () => {
      const mockReq = { user: { id: 'user-1' } };
      const pagination = { page: 1, limit: 10 };
      
      await controller.findAll(pagination, mockReq);
      expect(mockTasksService.findAll).toHaveBeenCalledWith('user-1', pagination);
    });
  });
});
