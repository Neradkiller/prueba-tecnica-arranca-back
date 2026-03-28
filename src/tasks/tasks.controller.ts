import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiCreatedResponse, 
  ApiOkResponse, 
  ApiCookieAuth, 
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse 
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Tasks')
@ApiCookieAuth('Authentication')
@ApiUnauthorizedResponse({ description: 'No autorizado. Token inválido o ausente en cookies.' })
@ApiForbiddenResponse({ description: 'Acceso denegado por CSRF (Falta X-Requested-With).' })
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiCreatedResponse({ description: 'Tarea creada exitosamente.' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas del usuario autenticado' })
  @ApiOkResponse({ description: 'Lista de tareas recuperada con paginación y caché.' })
  findAll(@Query() pagination: PaginationDto, @Req() req: any) {
    return this.tasksService.findAll(req.user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una tarea específica' })
  @ApiOkResponse({ description: 'Detalle de la tarea encontrado.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea existente' })
  @ApiOkResponse({ description: 'Tarea actualizada e invalidación de caché realizada.' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiOkResponse({ description: 'Tarea eliminada exitosamente.' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(id, req.user.id);
  }
}
