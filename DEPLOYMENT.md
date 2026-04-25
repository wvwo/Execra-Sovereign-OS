# Execra Sovereign OS v7 — Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] .env.production لا يوجد في git
- [ ] جميع الـ secrets تم توليدها بـ openssl
- [ ] Swagger UI معطّل في production
- [ ] /metrics محمي بـ nginx deny
- [ ] CORS مضبوط على domain الفعلي فقط
- [ ] JWT_EXPIRES_IN = 15m في production
- [ ] rate limiting فعّال على nginx وعلى Express

### Database
- [ ] Backup قبل أي migration
- [ ] جميع الـ indexes موجودة
- [ ] Connection pool مضبوط
- [ ] SSL connection لـ PostgreSQL فعّال

### Infrastructure
- [ ] جميع الـ Docker images مبنية بدون latest tag
- [ ] Health checks تعمل لكل service
- [ ] Resource limits محددة
- [ ] Logging مركزي يعمل
- [ ] Grafana dashboards تعمل

### CI/CD
- [ ] GitHub Actions تعمل على main
- [ ] npm audit لا يوجد critical vulnerabilities
- [ ] TypeScript 0 errors
- [ ] k6 smoke tests تعمل

### DNS & SSL
- [ ] Domain مضبوط
- [ ] SSL certificate مثبت
- [ ] HTTP يحوّل لـ HTTPS
- [ ] HSTS مفعّل

## Deployment Steps

1. توليد الـ secrets:
   bash scripts/generate-secrets.sh

2. تعبئة .env.production بالقيم الحقيقية

3. تشغيل migration:
   bash scripts/migrate-prod.sh

4. البناء والتشغيل:
   docker compose -f docker-compose.prod.yml up -d --build

5. التحقق:
   docker compose -f docker-compose.prod.yml ps
   curl https://yourdomain.com/health

## Rollback Plan

1. إيقاف الخدمات:
   docker compose -f docker-compose.prod.yml down

2. استعادة backup:
   gunzip -c backups/execra_TIMESTAMP.sql.gz | docker compose exec -T db psql -U $DB_USER -d $DB_NAME

3. Deploy النسخة السابقة:
   git checkout v6.x.x
   docker compose -f docker-compose.prod.yml up -d --build

## Monitoring URLs (Internal VPN only)
- Grafana: http://internal:3002
- Prometheus: http://internal:9090
