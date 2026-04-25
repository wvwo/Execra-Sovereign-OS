import express from 'express';
import { launchStealthBrowser } from './engines/browser';
import { executeWorkflow } from './executors/workflowExecutor';
import { Workflow } from './types/workflow';

const app = express();
app.use(express.json());

const SENTINEL_URL = process.env.SENTINEL_URL || 'http://sentinel:8001';
const SENTINEL_KEY = process.env.SENTINEL_API_KEY || '';

import client from 'prom-client';

const workflowExecutionDuration = new client.Histogram({
  name: 'autopilot_workflow_execution_duration_seconds',
  help: 'Workflow execution duration',
  labelNames: ['workflow_id']
});

const activeExecutions = new client.Gauge({
  name: 'autopilot_active_executions',
  help: 'Number of active executions'
});

client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.post('/api/v1/execute', async (req, res) => {
  const workflow: Workflow = req.body;
  
  if (!workflow.session_id || !workflow.steps) {
    return res.status(400).json({ error: 'Invalid workflow payload' });
  }

  try {
    const { browser, page } = await launchStealthBrowser({ headless: false });
    
    // Handle graceful shutdown
    let completed = false;
    const cleanup = async () => {
      if (!completed) {
        console.warn(`[${workflow.session_id}] Interrupted. Closing browser...`);
        await browser.close();
      }
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    await executeWorkflow(page, workflow, SENTINEL_URL, SENTINEL_KEY);
    completed = true;
    await browser.close();
    
    res.json({ status: 'success', session_id: workflow.session_id });
  } catch (error) {
    res.status(500).json({ 
      status: 'failure', 
      error: (error as Error).message,
      session_id: workflow.session_id 
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'execution-engine' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Execution Engine listening on port ${PORT}`);
});
