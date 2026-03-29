# Notas Arranca Backend - Gestión de Tareas Multitenant

API de alto rendimiento construida con NestJS para la gestión de tareas y notas, diseñada con un enfoque en seguridad, escalabilidad y experiencia de usuario.

---

## 🏗️ Descripción de la Arquitectura

El proyecto sigue una arquitectura **Modular y Orientada a Servicios** (basada en el estándar de NestJS), organizada en capas para garantizar el desacoplamiento y la mantenibilidad:

1.  **Capa de Controladores (Controllers)**: Gestiona las rutas, la entrada de datos mediante DTOs y define los códigos de respuesta HTTP.
2.  **Capa de Servicios (Services)**: Contiene la lógica de negocio pura, interactuando con los repositorios y la capa de caché.
3.  **Capa de Persistencia (Entities/Repositories)**: Utiliza TypeORM para mapear objetos TypeScript a tablas en PostgreSQL.
4.  **Capa de Seguridad (Guards)**: Implementa la defensa en profundidad mediante `JwtAuthGuard` (autenticación), `CsrfGuard` (integridad) y `ThrottlerGuard` (rate limiting).
5.  **Capa Transversal (Cross-cutting)**:
    *   **Logging**: `LoggingInterceptor` utiliza Winston para el seguimiento detallado de cada petición.
    *   **Manejo de Errores**: `AllExceptionsFilter` garantiza que todos los errores sigan un formato JSON uniforme.
    *   **Caché**: Sistema distribuido en Redis con lógica de invalidación por patrón de usuario.

---

## 💡 Decisiones Técnicas Tomadas

*   **JWT en Cookies HttpOnly**: Se decidió no enviar el token en el cuerpo del JSON ni guardarlo en `localStorage` del frontend. Al usar cookies `HttpOnly`, el token es inaccesible para scripts maliciosos, mitigando ataques **XSS**.
*   **Defensa CSRF personalizada**: Para evitar el uso de librerías pesadas de sincronización de tokens, se implementó un Guard que exige el header `X-Requested-With: XMLHttpRequest`. Esto asegura que la petición provenga de un cliente web legítimo y no de un formulario oculto en otro sitio.
*   **Gestión de Tags Independiente**: Las etiquetas se diseñaron como una entidad propia (`ManyToMany` con Tareas). Esto permite al usuario reutilizar etiquetas, filtrar por ellas en el futuro y mantener la consistencia de los datos.
*   **Invalidación Granular de Caché**: En lugar de borrar todo el caché global, el sistema detecta qué usuario realizó el cambio y purga únicamente sus páginas de tareas en Redis (`tasks:list:userId:*`), optimizando el rendimiento global del servidor.
*   **Despliegue Serverless en GCP**: Se eligió **Cloud Run** para el backend y **Cloud SQL** para la base de datos por su capacidad de escalado automático y facilidad de integración con **Secret Manager**, manteniendo las credenciales fuera del repositorio.

---

## 🚀 Tecnologías
- **Framework**: [NestJS](https://nestjs.com/) (Node.js 23+)
- **Base de Datos**: PostgreSQL 16 (TypeORM)
- **Caché & Throttling**: Redis 7
- **Seguridad**: JWT (Cookies HttpOnly), CSRF Protection, Bcrypt.
- **Logging**: Winston & Winston Daily Rotate File.
- **Documentación**: Swagger (OpenAPI 3.0)
- **Contenedores**: Docker & Docker Compose

---

## 🛠️ Instrucciones de Instalación y Ejecución

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en lo siguiente:
```env
# Servidor
PORT=3000
FRONTEND_URL=https://prueba-tecnca-arranca-front.vercel.app

# Base de Datos (Postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=notas_db

# Redis (Caché y Throttling)
REDIS_HOST=localhost
REDIS_PORT=6379

# Seguridad
JWT_SECRET=tu_secreto_super_seguro
```

### 2. Ejecución con Docker (Recomendado)
Levanta toda la infraestructura (Postgres, Redis y la App) con un solo comando:
```bash
docker-compose up --build -d
```

### 3. Ejecución Local (Desarrollo)
Si prefieres correrlo sin Docker para la App:
```bash
# 1. Instalar dependencias (Usar --legacy-peer-deps por conflictos de NestJS 11)
npm install --legacy-peer-deps

# 2. Generar build
npm run build

# 3. Iniciar servidor
npm run start:dev
```

---

## 📚 Documentación de la API

La documentación interactiva y detallada (Swagger) está disponible en: **`http://localhost:3000/api/docs`**

### Resumen de Endpoints (`/api/v1`)

#### Módulo de Autenticación (`/auth`)
| Método | Ruta | Descripción | HTTP Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Inicia sesión y setea cookie. | 200 OK |
| `POST` | `/logout` | Limpia la cookie de sesión. | 200 OK |
| `GET` | `/me` | Perfil del usuario autenticado. | 200 OK |

#### Módulo de Usuarios (`/users`)
| Método | Ruta | Descripción | HTTP Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registra un nuevo usuario. | 201 Created |

#### Módulo de Tareas (`/tasks`)
*Requieren Cookie `Authentication` y Header `X-Requested-With`.*
| Método | Ruta | Parámetros Query | Observaciones |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `page`, `limit` | Caché Activo |
| `POST` | `/` | (Cuerpo JSON) | Invalida Caché |
| `PATCH` | `/:id` | (Cuerpo JSON) | Actualización parcial |
| `DELETE` | `/:id` | - | Eliminación total |

---

## 🧪 Pruebas (Testing)

El sistema cuenta con una cobertura integral de pruebas unitarias y de integración:

*   **Pruebas Unitarias**: Validan lógica de negocio, servicios e invalidación de caché.
    ```bash
    npm test
    ```
*   **Pruebas E2E**: Validan el flujo completo y la efectividad de los Guards de Seguridad.
    ```bash
    npm run test:e2e
    ```

---

## 🔒 Seguridad Implementada
*   **Aislamiento Multitenant**: El filtrado por `userId` es obligatorio en todas las consultas a DB y Caché.
*   **Rate Limiting**: Límites configurados dinámicamente en Redis para evitar abusos por IP.
*   **Logs de Auditoría**: Almacenados en la carpeta `/logs` con rotación diaria para análisis post-mortem.
