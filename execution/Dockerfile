FROM node:20-slim

# Install dependencies for Patchright/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run as non-root
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 4001

CMD ["npm", "start"]
