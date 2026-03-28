# Notas Arranca Backend - Gestión de Tareas Multitenant

API de alto rendimiento construida con NestJS para la gestión de tareas y notas, diseñada con un enfoque en seguridad, escalabilidad y experiencia de usuario.

## 🚀 Tecnologías
- **Framework**: [NestJS](https://nestjs.com/) (Node.js 23+)
- **Base de Datos**: PostgreSQL 16 (TypeORM)
- **Caché & Throttling**: Redis 7
- **Seguridad**: JWT (Cookies HttpOnly), CSRF Protection, Bcrypt.
- **Documentación**: Swagger (OpenAPI 3.0)
- **Contenedores**: Docker & Docker Compose

---

## 🔒 Seguridad Implementada
- **Autenticación Basada en Cookies**: El JWT se almacena en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`. Esto mitiga ataques XSS al no exponer el token al JavaScript del cliente.
- **Protección CSRF**: Todas las peticiones de mutación (`POST`, `PUT`, `PATCH`, `DELETE`) requieren la cabecera `X-Requested-With: XMLHttpRequest`.
- **Rate Limiting (Throttling)**:
  - Global: 100 req/min.
  - Login: 5 req/5 min (Anti fuerza bruta).
  - Registro: 1 req/min (Anti spam).
- **Aislamiento Multitenant**: Cada usuario solo tiene acceso a sus propias tareas y etiquetas mediante filtrado obligatorio por `userId` inyectado desde el JWT.

---

## 🛠️ Configuración y Ejecución

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en lo siguiente:
```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173

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
# 1. Instalar dependencias
npm install

# 2. Generar build
npm run build

# 3. Iniciar servidor
npm run start:dev
```

---

## 📚 Documentación de la API (Endpoints)

La documentación interactiva está disponible en: **`http://localhost:3000/api/docs`**

### Módulo de Autenticación (`/api/v1/auth`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Login y seteo de cookie `Authentication`. | Rate Limit: 5/5min |
| `POST` | `/logout` | Limpia la cookie de sesión. | JWT Cookie |
| `GET` | `/me` | Retorna el perfil del usuario autenticado. | JWT Cookie |

### Módulo de Usuarios (`/api/v1/users`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registra un nuevo usuario en el sistema. | Rate Limit: 1/min |

### Módulo de Tareas (`/api/v1/tasks`)
*Requieren Cookie `Authentication` y Header `X-Requested-With`.*
| Método | Ruta | Descripción | Observaciones |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lista tareas paginadas. | Caché Activo |
| `POST` | `/` | Crea una nueva tarea con tags. | Invalida Caché |
| `GET` | `/:id` | Detalle de una tarea específica. | Filtrado por Dueño |
| `PATCH` | `/:id` | Actualiza título, estado, prioridad o tags. | Invalida Caché |
| `DELETE` | `/:id` | Elimina la tarea permanentemente. | Invalida Caché |

### Módulo de Etiquetas (`/api/v1/tags`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Obtiene todas las etiquetas del usuario. |
| `POST` | `/` | Crea una etiqueta personalizada (Nombre/Color). |
| `PATCH` | `/:id` | Actualiza nombre o color de la etiqueta. |
| `DELETE` | `/:id` | Elimina el tag (se desvincula de tareas). |

---

## 🧪 Pruebas (Testing)

### Pruebas Unitarias
Validan la lógica de negocio, servicios e invalidación de caché (usando mocks).
```bash
npm test
```

### Pruebas E2E
Validan el flujo completo y los Guards de Seguridad (CSRF, Auth).
```bash
npm run test:e2e
```

---

## 🏗️ Arquitectura de Caché
El sistema utiliza **Redis** para mejorar el tiempo de respuesta:
1. Al consultar tareas (`GET /tasks`), el resultado se guarda en Redis bajo una llave única por usuario y página.
2. Al realizar cualquier cambio (`CREATE`, `UPDATE`, `DELETE`), el sistema realiza una **purgue automática** de todas las páginas de caché del usuario para garantizar consistencia absoluta.
