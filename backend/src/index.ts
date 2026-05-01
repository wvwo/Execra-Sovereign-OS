import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth';
import workflowRoutes from './routes/workflows';
import executionRoutes from './routes/execution';
import templateRoutes from './routes/templates';
import analyticsRoutes from './routes/analytics';
import variableRoutes from './routes/variables';
import notificationRoutes from './routes/notifications';
import aiAssistRoutes from './routes/aiAssist';
import triggerRoutes from './routes/triggers';
import privacyShieldRoutes from './routes/privacyShield';
import auditRoutes from './routes/audit';
import legacyRoutes from './legacyRoutes';

import { apiLimiter } from './middleware/rateLimit';
import {
  authLimiter,
  uploadLimiter,
  analysisLimiter,
  executionLimiter,
} from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './services/websocket';
import { swaggerSpec } from './swagger';

const app = express();
const server = http.createServer(app);

// Trust Railway's reverse proxy
app.set('trust proxy', 1);

// ── Security headers (Phase 9) ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
  })
);

// Permissions-Policy header (helmet doesn't set this)
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://process-autopilot.vercel.app',
      'https://execra-sovereign-os.vercel.app',
      /^https:\/\/.*\.vercel\.app$/,
    ],
    credentials: true,
  })
);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// General fallback limiter (all routes)
app.use(apiLimiter);

// ── Routes with per-route rate limits ────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'Execra API v7', health: '/health' }));
app.get('/health', (_req, res) =>
  res.json({ status: 'healthy', service: 'backend-api', timestamp: new Date().toISOString() })
);

// Auth: strict 5/15min brute-force protection
app.use('/api/v1/auth', authLimiter, authRoutes);

// Workflows: upload limited to 10/hr
app.use('/api/v1/workflows', workflowRoutes);

// Execution: 100/day limit
app.use('/api/v1/execute', executionLimiter, executionRoutes);

// AI assist: 20/hr
app.use('/api/v1/ai-assist', analysisLimiter, aiAssistRoutes);

// Upload endpoint within workflows also needs upload limit — applied in router
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/variables', variableRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/triggers', triggerRoutes);
app.use('/api/v1/privacy', privacyShieldRoutes);
app.use('/api/v1/audit', auditRoutes);

app.use('/', legacyRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// 404 handler — must be after all routes
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

const io = setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.setTimeout(30000);
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000;
server.listen(PORT, () => {
  console.log(`Backend API + WebSocket listening on port ${PORT}`);
});
