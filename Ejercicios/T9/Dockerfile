FROM node:20-alpine AS builder

WORKDIR /app

# Instalar OpenSSL que necesita Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL también en la imagen final
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY src ./src
COPY package*.json ./

EXPOSE 3000

CMD ["node", "src/app.js"]