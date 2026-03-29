# Stage 1: Build & Test
FROM node:23.3.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Paso Crítico: Ejecutar pruebas unitarias. 
# Si fallan, el build de Docker se detiene aquí.
RUN npm test

RUN npm run build

# Stage 2: Production
FROM node:23.3.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# GCP Cloud Run inyectará el puerto dinámicamente
EXPOSE 3000

CMD ["node", "dist/main"]
