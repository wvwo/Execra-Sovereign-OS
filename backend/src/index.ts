import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import workflowRoutes from './routes/workflows';
import executionRoutes from './routes/execution';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import http from 'http';
import { setupWebSocket } from './services/websocket';
// metricsMiddleware / metricsEndpoint disabled for cloud deployments (prom-client not compatible with serverless)
import cookieParser from 'cookie-parser';
import legacyRoutes from './legacyRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://process-autopilot.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
  ],
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(apiLimiter);

// Routes
import authRoutes from './routes/auth';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/execute', executionRoutes);
app.use('/', legacyRoutes);


// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));


/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: System health check
 *     responses:
 *       200:
 *         description: Healthy
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'backend-api', timestamp: new Date().toISOString() });
});

// /metrics endpoint disabled — use Docker/Prometheus scraping in self-hosted environments only

app.use(errorHandler);

const io = setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.setTimeout(30000); // 30 seconds timeout against Slowloris attacks
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000; // Must be > keepAliveTimeout
server.listen(PORT, () => {
  console.log(`Backend API + WebSocket listening on port ${PORT}`);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success - returns JWT token
 *       401:
 *         description: Invalid credentials
 * 
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     responses:
 *       200:
 *         description: Success
 * 
 * /api/workflows:
 *   get:
 *     tags: [Workflows]
 *     summary: Get all workflows
 *     responses:
 *       200:
 *         description: Success
 *   post:
 *     tags: [Workflows]
 *     summary: Create a new workflow
 *     responses:
 *       201:
 *         description: Created
 * 
 * /api/workflows/{id}:
 *   put:
 *     tags: [Workflows]
 *     summary: Update a workflow
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Workflows]
 *     summary: Delete a workflow
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 * 
 * /api/workflows/{id}/execute:
 *   post:
 *     tags: [Workflows]
 *     summary: Execute a workflow
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Execution started
 */
