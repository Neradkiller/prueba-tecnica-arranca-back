# Stage 1: Build
FROM node:23.3.0-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar (si hubiera nativas)
# RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:23.3.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Instalar solo dependencias de producción (omitir devDependencies)
COPY package*.json ./
RUN npm ci --only=production

# Copiar el código compilado desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Puerto por defecto (se puede sobreescribir con PORT=XXXX)
EXPOSE 3000

# Ejecutar la aplicación en producción
CMD ["node", "dist/main"]
