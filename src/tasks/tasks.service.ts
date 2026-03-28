import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Task } from './task.entity';
import { Tag } from './tag.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKeys(userId: string, pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const listKey = pagination 
      ? `tasks:list:${userId}:p${page}:l${limit}`
      : `tasks:list:${userId}`;
    return { list: listKey, tags: `tags:list:${userId}` };
  }

  private async invalidateUserTasksCache(userId: string) {
    const store: any = this.cacheManager;
    try {
      if (store.store && typeof store.store.keys === 'function') {
        const keys = await store.store.keys(`tasks:list:${userId}:*`);
        for (const key of keys) await this.cacheManager.del(key);
      }
    } catch (e) {}
    
    // FALLBACK CRÍTICO: El In-Memory store de cache-manager no soporta pattern matching (keys).
    // Para evitar que el Dashboard o las listas queden oxidadas (stale) por 10 minutos,
    // debemos forzar la limpieza de las vistas paginadas por defecto.
    await this.cacheManager.del(`tasks:list:${userId}:p1:l50`);
    await this.cacheManager.del(`tasks:list:${userId}:p1:l10`);
    await this.cacheManager.del(`tasks:list:${userId}`);
  }

  // --- TAGS MANAGEMENT ---

  async createTag(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
    const tag = this.tagRepository.create({ ...createTagDto, userId });
    const savedTag = await this.tagRepository.save(tag);
    await this.cacheManager.del(this.getCacheKeys(userId).tags);
    return savedTag;
  }

  async findAllTags(userId: string): Promise<Tag[]> {
    const key = this.getCacheKeys(userId).tags;
    const cachedTags = await this.cacheManager.get<Tag[]>(key);
    if (cachedTags) return cachedTags;
    const tags = await this.tagRepository.find({ where: { userId }, order: { name: 'ASC' } });
    await this.cacheManager.set(key, tags, 600000);
    return tags;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto, userId: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id, userId } });
    if (!tag) throw new NotFoundException(`Tag with ID "${id}" not found`);
    Object.assign(tag, updateTagDto);
    const updatedTag = await this.tagRepository.save(tag);
    await this.cacheManager.del(this.getCacheKeys(userId).tags);
    await this.invalidateUserTasksCache(userId);
    return updatedTag;
  }

  async removeTag(id: string, userId: string): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id, userId } });
    if (!tag) throw new NotFoundException(`Tag with ID "${id}" not found`);
    await this.tagRepository.remove(tag);
    await this.cacheManager.del(this.getCacheKeys(userId).tags);
    await this.invalidateUserTasksCache(userId);
  }

  // --- TASKS MANAGEMENT ---

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const { tagIds, startDate, endDate, ...taskData } = createTaskDto;
    const task = this.taskRepository.create({
      ...taskData,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      userId,
    });
    if (tagIds && tagIds.length > 0) {
      task.tags = await this.tagRepository.find({ where: { id: In(tagIds), userId } });
    }
    const savedTask = await this.taskRepository.save(task);
    await this.invalidateUserTasksCache(userId);
    return savedTask;
  }

  async findAll(userId: string, pagination: PaginationDto): Promise<{ data: Task[], meta: any }> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const key = this.getCacheKeys(userId, pagination).list;
    const cachedResult = await this.cacheManager.get<{ data: Task[], meta: any }>(key);
    if (cachedResult) return cachedResult;
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { userId },
      relations: ['tags'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const result = {
      data: tasks,
      meta: {
        totalItems: total,
        itemCount: tasks.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }
    };
    await this.cacheManager.set(key, result, 600000);
    return result;
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id, userId }, relations: ['tags'] });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const { tagIds, startDate, endDate, ...taskData } = updateTaskDto;
    const task = await this.findOne(id, userId);
    Object.assign(task, taskData);
    if (startDate !== undefined) task.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) task.endDate = endDate ? new Date(endDate) : null;
    if (tagIds) {
      task.tags = await this.tagRepository.find({ where: { id: In(tagIds), userId } });
    }
    const updatedTask = await this.taskRepository.save(task);
    await this.invalidateUserTasksCache(userId);
    return updatedTask;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
    await this.invalidateUserTasksCache(userId);
  }
}
