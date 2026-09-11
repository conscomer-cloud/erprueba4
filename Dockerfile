# CONSCORE ERP IA — imagen de producción
FROM node:22.22.2-slim AS build

WORKDIR /app

# Las dependencias se copian aparte para que Docker reutilice la capa
# mientras package.json no cambie.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---

FROM node:22.22.2-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# La base de datos vive aquí. En Render se monta un disco en esta ruta;
# en Cloud Run hay que montar un volumen o el contenido se pierde al reiniciar.
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/conscore_db.json

# El puerto real lo inyecta la plataforma; 3000 es solo el valor por defecto.
EXPOSE 3000

CMD ["node", "dist/server.cjs"]
