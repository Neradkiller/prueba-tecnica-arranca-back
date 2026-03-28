import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@ApiTags('Tags')
@ApiCookieAuth('Authentication')
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva etiqueta' })
  @ApiCreatedResponse({ description: 'Etiqueta creada exitosamente.' })
  async create(@Body() createTagDto: CreateTagDto, @Req() req: any) {
    return this.tasksService.createTag(createTagDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las etiquetas del usuario' })
  @ApiOkResponse({ description: 'Lista de etiquetas recuperada.', type: [CreateTagDto] })
  async findAll(@Req() req: any) {
    return this.tasksService.findAllTags(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una etiqueta' })
  @ApiOkResponse({ description: 'Etiqueta actualizada exitosamente.' })
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: any
  ) {
    return this.tasksService.updateTag(id, updateTagDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una etiqueta' })
  @ApiOkResponse({ description: 'Etiqueta eliminada exitosamente.' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.removeTag(id, req.user.id);
  }
}
