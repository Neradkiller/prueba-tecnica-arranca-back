import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '../enums/priority.enum';

export class CreateTaskDto {
  @ApiProperty({ description: 'Título de la tarea', example: 'Reunión de planificación' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descripción detallada', example: 'Discutir los objetivos del Q2', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ description: 'Fecha de inicio', example: '2026-03-28T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin', example: '2026-03-28T11:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Clase de color para la UI', example: 'bg-blue-500', required: false })
  @IsString()
  @IsOptional()
  colorClass?: string;

  @ApiProperty({ description: 'IDs de las etiquetas', example: ['uuid-1'], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tagIds?: string[];
}
