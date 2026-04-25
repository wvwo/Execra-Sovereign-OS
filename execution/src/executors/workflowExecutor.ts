import { Page } from 'patchright';
import { Workflow } from '../types/workflow';
import { StepExecutor } from './stepExecutor';
import { SentinelClient } from '../sentinel/client';

export async function executeWorkflow(
  page: Page,
  workflow: Workflow,
  sentinelUrl: string,
  sentinelKey: string
): Promise<void> {
  const sentinel = new SentinelClient(sentinelUrl, sentinelKey);
  const variables = new Map<string, string>();

  await sentinel.log({
    session_id: workflow.session_id,
    workflow_id: workflow.workflow_id,
    event_type: 'WORKFLOW_START',
    action: 'EXECUTION_BEGIN',
    status: 'success'
  });

  const executor = new StepExecutor(page, sentinel, workflow.session_id, workflow.workflow_id, variables);

  for (const step of workflow.steps) {
    console.log(`[${workflow.session_id}] Step ${step.step_id}: ${step.action}`);
    await executor.execute(step);
    await page.waitForTimeout(500 + Math.random() * 1500); // Human thinking pause
  }

  await sentinel.log({
    session_id: workflow.session_id,
    workflow_id: workflow.workflow_id,
    event_type: 'WORKFLOW_COMPLETE',
    action: 'EXECUTION_END',
    status: 'success',
    details: { variables: Object.fromEntries(variables) }
  });

  console.log(`[${workflow.session_id}] Workflow completed successfully`);
}
