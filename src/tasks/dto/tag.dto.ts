import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ 
    description: 'Nombre descriptivo de la etiqueta', 
    example: 'Trabajo', 
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Color asociado a la etiqueta (CSS, Hex o clase)', 
    example: '#3498db', 
    required: false 
  })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateTagDto {
  @ApiProperty({ 
    description: 'Nuevo nombre de la etiqueta', 
    example: 'Urgente', 
    required: false 
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    description: 'Nuevo color de la etiqueta', 
    example: '#e74c3c', 
    required: false 
  })
  @IsString()
  @IsOptional()
  color?: string;
}
