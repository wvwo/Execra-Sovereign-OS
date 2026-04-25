FROM node:22-alpine AS builder


WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY . .
RUN npm run build

FROM nginx:alpine

# Remove default nginx user and run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx needs to write to some dirs
RUN chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
