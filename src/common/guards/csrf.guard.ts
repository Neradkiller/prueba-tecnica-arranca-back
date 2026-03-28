import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Solo aplicamos la validación a métodos de mutación
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutationMethods.includes(request.method)) {
      return true;
    }

    const requestedWith = request.headers['x-requested-with'];
    
    // Se espera que el cliente Axios/Fetch envíe este header por defecto o manualmente
    if (requestedWith !== 'XMLHttpRequest') {
      throw new ForbiddenException(
        'CSRF attempt detected: Missing or invalid X-Requested-With header.'
      );
    }

    return true;
  }
}
