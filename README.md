# ⚡ Execra Sovereign OS v7 ⚡

> **Enterprise AI Workflow Automation Platform**
> *Absolute Sovereignty. Zero-Trust Local Extinction of PII.*

---

## 🌌 Architecture
Execra operates on the **Hex-Core Pantheon Architecture**, ensuring high performance and absolute data privacy.

| Service | Technology | Port |
|---------|------------|------|
| **Frontend** | Vite + TypeScript | 3000 |
| **Backend API** | Node.js + Express + WS | 3001 |
| **Vision Engine** | Python VLM Service | 8000 |
| **Sentinel** | Security & Audit | 8001 |
| **Database** | PostgreSQL 15 | 5432 |
| **Cache** | Redis 7 | 6379 |
| **Storage** | MinIO (S3 Compatible) | 9000/9001 |

---

## ⚙️ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/execra.git
cd execra

# Start the entire stack
docker compose up -d
```

---

## 🛡️ Security
*   **Zero-Trust PII Redaction**: Core automation logic runs entirely on local, isolated containers.
*   **AES-256-GCM Encryption**: Encrypts all sensitive state mutations.
*   **Sentinel Guard**: Real-time monitoring of security audit logs.
*   **Rate Limiting**: Integrated protection against automated abuse.

---

## 📊 Monitoring & Documentation
*   **Grafana Dashboard**: [http://localhost:3002](http://localhost:3002)
*   **Prometheus Metrics**: [http://localhost:9090](http://localhost:9090)
*   **API Documentation**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
*   **Internal Metrics**: [http://localhost:3001/metrics](http://localhost:3001/metrics)

---

## 🚀 Load Testing (k6)

Validate performance thresholds locally or in CI:

```bash
# Smoke test (Quick validation)
k6 run load-tests/smoke.js

# Stress test (Full system load)
k6 run load-tests/stress.js
```

---

## 🚀 Quick Deploy

### Frontend → Vercel (one-click)
1. Import this repo in [vercel.com/new](https://vercel.com/new)
2. Vercel auto-detects `vercel.json` — no framework override needed
3. Add environment variable in Vercel dashboard:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.railway.app` |

### Backend → Railway
1. New project → **Deploy from GitHub repo**
2. Set **Root Directory** to `backend/`
3. Railway auto-runs `npm install && npm run build && npm start`
4. Add a **PostgreSQL** plugin inside Railway (auto-sets `DATABASE_URL`)
5. Set all required environment variables (see below)

### Required Environment Variables (backend)
```
JWT_SECRET=
REFRESH_TOKEN_SECRET=
OPENAI_API_KEY=
DATABASE_URL=              # auto-set by Railway PostgreSQL plugin
REDIS_URL=                 # optional — falls back to in-memory rate limiting
SENTINEL_API_KEY=
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🔄 CI/CD Pipeline
*   **Type Safety**: `tsc --noEmit` validation on every push.
*   **Security Gates**: `npm audit` blocks any merge with **Critical** vulnerabilities.
*   **Automated Builds**: Docker images are built and tagged on merge to `main`.
*   **Continuous Testing**: Load tests run automatically on deployment to staging.
