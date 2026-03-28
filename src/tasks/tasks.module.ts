import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TagsController } from './tags.controller';
import { Task } from './task.entity';
import { Tag } from './tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Tag])],
  controllers: [TasksController, TagsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
