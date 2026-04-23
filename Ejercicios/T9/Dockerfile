# ── Fase 1: builder ───────────────────────────────────────────────────────────
# Usamos una imagen ligera de Node para construir
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos primero solo los archivos de dependencias (mejor caché de Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos todas las dependencias (incluidas las de dev, necesitamos prisma CLI)
RUN npm ci

# Generamos el cliente de Prisma
RUN npx prisma generate

# ── Fase 2: producción ────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copiamos las dependencias ya instaladas desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copiamos el código fuente
COPY src ./src
COPY package*.json ./

# Puerto que expone la app (Railway lo detecta automáticamente)
EXPOSE 3000

# Comando de arranque
CMD ["node", "src/app.js"]
