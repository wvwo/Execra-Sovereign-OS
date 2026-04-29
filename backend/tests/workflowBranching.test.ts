// Workflow Branching Logic Tests
import { validateWorkflow } from '../src/validators/workflowValidator';

describe('Workflow Validator — Branching & Webhook Steps', () => {
  const baseWorkflow = {
    workflow_title: 'Test Workflow',
    start_url: 'https://example.com',
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    steps: [] as unknown[],
  };

  it('accepts a workflow with a branch step', () => {
    const wf = {
      ...baseWorkflow,
      steps: [
        {
          step_id: 1,
          action: 'branch',
          condition: { variable: 'status', operator: 'equals', value: 'active' },
          if_true: [2],
          if_false: [3],
        },
        { step_id: 2, action: 'click', target: { strategy: 'text_content', value: 'Proceed' } },
        { step_id: 3, action: 'click', target: { strategy: 'text_content', value: 'Skip' } },
      ],
    };
    const result = validateWorkflow(wf);
    expect(result.riskLevel).not.toBe('critical');
  });

  it('accepts a workflow with a webhook step', () => {
    const wf = {
      ...baseWorkflow,
      steps: [
        {
          step_id: 1,
          action: 'webhook',
          target_url: 'https://hooks.example.com/notify',
          payload: { key: 'value' },
        },
      ],
    };
    const result = validateWorkflow(wf);
    expect(result.riskLevel).not.toBe('critical');
  });

  it('rejects webhook step pointing to localhost', () => {
    const wf = {
      ...baseWorkflow,
      steps: [
        {
          step_id: 1,
          action: 'webhook',
          target_url: 'http://localhost:8080/steal',
        },
      ],
    };
    const result = validateWorkflow(wf);
    expect(result.isValid).toBe(false);
    expect(result.riskLevel).toBe('critical');
  });

  it('marks workflow valid when all steps are safe', () => {
    const wf = {
      ...baseWorkflow,
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://example.com' },
        { step_id: 2, action: 'click', target: { strategy: 'text_content', value: 'Login' } },
      ],
    };
    const result = validateWorkflow(wf);
    expect(result.isValid).toBe(true);
    expect(result.riskLevel).toBe('low');
  });
});
