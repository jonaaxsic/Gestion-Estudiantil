# ===========================================
# Dockerfile - Frontend Angular
# ===========================================

# Fase 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copiar package.json y bun.lockb
COPY package.json ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build para producción
RUN bun run build

# Fase 2: Servir con nginx
FROM nginx:alpine

# Copiar los archivos buildados de la fase anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]