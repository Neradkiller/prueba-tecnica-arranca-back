import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

import { envValidationSchema } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get<string>('DB_HOST');
        const isSocket = dbHost && dbHost.startsWith('/');
        
        return {
          type: 'postgres',
          // Para Postgres via Unix Socket, la ruta debe ir en 'host'
          host: dbHost, 
          // Si es socket, no se debe proveer puerto (el driver lo ignora pero Nest puede confundirse)
          port: isSocket ? undefined : config.get<number>('DB_PORT'),
          
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          retryAttempts: 5,
          retryDelay: 5000,
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        try {
          const store = await redisStore({
            socket: {
              host: config.get<string>('REDIS_HOST'),
              port: config.get<number>('REDIS_PORT'),
              connectTimeout: 10000,
            },
            ttl: 600000,
          });
          return { store };
        } catch (error) {
          console.error('Redis Connection Failed, falling back to memory', error);
          return { ttl: 600000 }; 
        }
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60000, limit: 5000 }],
        storage: new ThrottlerStorageRedisService({
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        }),
      }),
    }),
    UsersModule,
    AuthModule,
    TasksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
