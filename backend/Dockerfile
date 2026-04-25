FROM node:22-slim AS builder


WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY *.js ./
COPY *.json ./
COPY eng.traineddata ./

RUN npm run build

# --- Production stage ---
FROM node:22-slim


RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY *.js ./
COPY *.json ./
COPY eng.traineddata ./


USER root
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3001

CMD ["node", "dist/index.js"]

