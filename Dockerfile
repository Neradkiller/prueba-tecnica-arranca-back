# Stage 1: Build
FROM node:23.3.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Usamos legacy-peer-deps para resolver conflictos de class-validator en NestJS 11
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:23.3.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# También aplicamos el flag para las dependencias de producción
RUN npm ci --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# GCP Cloud Run inyectará el puerto dinámicamente
EXPOSE 3000

CMD ["node", "dist/main"]
