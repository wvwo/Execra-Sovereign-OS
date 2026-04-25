FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY *.js ./
COPY *.json ./

# Download eng.traineddata at build time (it's in .gitignore)
RUN wget -q -O eng.traineddata https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata || echo "eng.traineddata download skipped"

RUN npm run build

# --- Production stage ---
FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/eng.traineddata ./eng.traineddata
COPY *.js ./
COPY *.json ./

USER root
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3001

CMD ["node", "dist/index.js"]
