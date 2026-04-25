import { validateWorkflow } from '../src/validators/workflowValidator';

describe('Workflow Validator', () => {
  it('should validate a correct workflow', () => {
    const validData = {
      workflow_title: 'Test Workflow',
      start_url: 'https://example.com',
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      steps: [
        {
          step_id: 1,
          action: 'click',
          target: { strategy: 'css_selector', value: 'button' }
        }
      ]
    };
    const result = validateWorkflow(validData);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should invalidate an empty workflow', () => {
    const result = validateWorkflow({});
    expect(result.isValid).toBe(false);
  });
});
