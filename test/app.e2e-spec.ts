import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Sincronizar con la configuración de main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      transform: true 
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security Guards', () => {
    it('should block mutation requests without X-Requested-With (CSRF)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({ title: 'No CSRF' })
        .expect(403); // El CsrfGuard debe disparar 403
    });
    
    it('should allow pass CSRF but block with 401 (Auth) when header is present', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'With CSRF' })
        .expect(401); // Pasa CSRF pero falla Autenticación (esperado)
    });
  });

  describe('Endpoints Existence & Auth', () => {
    it('GET /api/v1/tags should exist and require authentication (401)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tags')
        .expect(401);
    });

    it('GET /api/v1/tasks should exist and require authentication (401)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(401);
    });
  });
});
