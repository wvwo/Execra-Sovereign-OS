#!/bin/bash
echo "# Generated $(date)" > .env.production
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env.production
echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 64)" >> .env.production
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "SENTINEL_API_KEY=$(openssl rand -hex 32)" >> .env.production
echo "EXECRA_SDK_API_KEY=$(openssl rand -hex 32)" >> .env.production
echo "GRAFANA_PASSWORD=$(openssl rand -base64 24)" >> .env.production
echo "✅ Secrets generated in .env.production"
echo "⚠️  NEVER commit this file to git!"
chmod 600 .env.production
