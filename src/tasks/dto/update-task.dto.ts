import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: 'Estado de la tarea', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
