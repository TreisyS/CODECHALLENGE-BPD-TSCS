# ====== STAGE 1: Build ======
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias (incluye devDependencies para build)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ====== STAGE 2: Producción ======
FROM node:20-alpine

# Crear usuario no root
RUN addgroup app && adduser -S -G app app

WORKDIR /app

# Copiar solo lo necesario desde el build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Cambiar a usuario seguro
USER app

# Puerto expuesto (ajústalo si tu app usa otro)
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/app.js"]
