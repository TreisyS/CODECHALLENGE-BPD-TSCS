# ====== STAGE 1: Build ======
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# ====== STAGE 2: Producción ======
FROM node:20-alpine

# usuario no root
RUN addgroup app && adduser -S -G app app

WORKDIR /app

# lo necesario desde el build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Cambiamos al usuario no root
USER app

# puerto
EXPOSE 3000

# Comando para ejecutar el servidor 
CMD ["node", "dist/app.js"]
