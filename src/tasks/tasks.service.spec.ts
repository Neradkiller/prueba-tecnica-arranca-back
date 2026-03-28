import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Tag } from './tag.entity';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: any;
  let tagRepo: any;
  let cacheManager: any;

  const mockUser = { id: 'user-uuid' };
  const mockTask = { id: 'task-uuid', title: 'Test Task', userId: mockUser.id, tags: [] };
  const mockTag = { id: 'tag-uuid', name: 'Urgent', userId: mockUser.id };

  beforeEach(async () => {
    taskRepo = {
      create: jest.fn().mockReturnValue(mockTask),
      save: jest.fn().mockResolvedValue(mockTask),
      find: jest.fn().mockResolvedValue([mockTask]),
      findOne: jest.fn().mockResolvedValue(mockTask),
      remove: jest.fn().mockResolvedValue(mockTask),
      findAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
    };

    tagRepo = {
      create: jest.fn().mockReturnValue(mockTag),
      save: jest.fn().mockResolvedValue(mockTag),
      find: jest.fn().mockResolvedValue([mockTag]),
      findOne: jest.fn().mockResolvedValue(mockTag),
      remove: jest.fn().mockResolvedValue(mockTag),
    };

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      store: {
        keys: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('Tags CRUD', () => {
    it('should create a tag and invalidate cache', async () => {
      const result = await service.createTag({ name: 'Urgent' }, mockUser.id);
      expect(tagRepo.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith(`tags:list:${mockUser.id}`);
      expect(result).toEqual(mockTag);
    });

    it('should find all tags for a user', async () => {
      const result = await service.findAllTags(mockUser.id);
      expect(tagRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockTag]);
    });
  });

  describe('Tasks with Pagination', () => {
    it('should return paginated tasks and meta', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const result = await service.findAll(mockUser.id, paginationDto);

      expect(taskRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
      expect(result.meta.totalPages).toBe(1);
      expect(result.data).toEqual([mockTask]);
    });

    it('should return cached tasks if available', async () => {
      const cached = { data: [mockTask], meta: {} };
      cacheManager.get.mockResolvedValue(cached);
      
      const result = await service.findAll(mockUser.id, { page: 1, limit: 10 });
      expect(taskRepo.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all user task pages on task removal', async () => {
      // Mock store.keys for invalidation logic
      (cacheManager.store.keys as jest.Mock).mockResolvedValue([`tasks:list:${mockUser.id}:p1:l10`]);
      
      await service.remove('task-uuid', mockUser.id);
      
      expect(cacheManager.del).toHaveBeenCalledWith(`tasks:list:${mockUser.id}:p1:l10`);
      expect(cacheManager.del).toHaveBeenCalledWith(`tasks:list:${mockUser.id}`);
    });
  });
});
