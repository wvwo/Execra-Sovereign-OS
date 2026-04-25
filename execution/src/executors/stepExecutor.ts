import { Page, Locator } from 'patchright';
import { WorkflowStep, Workflow } from '../types/workflow';
import { humanClick, humanType } from '../engines/interaction';
import { handleCaptchaHumanInTheLoop } from '../captcha/detector';
import { SentinelClient } from '../sentinel/client';
import { uploadScreenshot } from '../utils/storage';

export class StepExecutor {
  constructor(
    private page: Page,
    private sentinel: SentinelClient,
    private sessionId: string,
    private workflowId: string,
    private variables: Map<string, string>
  ) {}

  async resolveTarget(step: WorkflowStep): Promise<Locator> {
    if (!step.target) throw new Error('No target specified');
    const { strategy, value, match_type = 'exact', timeout_ms = 5000 } = step.target;

    let locator: Locator;
    switch (strategy) {
      case 'text_content':
        locator = match_type === 'exact'
          ? this.page.getByText(value, { exact: true })
          : this.page.getByText(value, { exact: false });
        break;
      case 'css_selector':
        locator = this.page.locator(value);
        break;
      case 'xpath':
        locator = this.page.locator(`xpath=${value}`);
        break;
      case 'role':
        locator = this.page.getByRole(value as any);
        break;
      case 'placeholder':
        locator = this.page.getByPlaceholder(value);
        break;
      case 'test_id':
        locator = this.page.getByTestId(value);
        break;
      case 'aria_label':
        locator = this.page.getByLabel(value);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }

    await locator.waitFor({ state: 'visible', timeout: timeout_ms });
    return locator;
  }

  async execute(step: WorkflowStep): Promise<void> {
    const stealth = step.stealth ?? { humanize: true, bezier_curves: true, typing_speed_wpm: 45 };
    const startTime = Date.now();

    try {
      // Screenshot before
      if (step.audit?.screenshot_before) {
        const buffer = await this.page.screenshot({ type: 'png', fullPage: false });
        const upload = await uploadScreenshot(this.sessionId, step.step_id, Buffer.from(buffer), 'before');
        
        await this.sentinel.log({
          session_id: this.sessionId,
          step_id: step.step_id,
          event_type: 'STEP_EXECUTION',
          action: 'SCREENSHOT_BEFORE',
          status: 'success',
          details: { screenshot_url: upload.url, s3_key: upload.key }
        });
      }

      // Check CAPTCHA before action
      await handleCaptchaHumanInTheLoop(this.page, this.sessionId, this.sentinel.url.replace('/api/v1', ''));

      switch (step.action) {
        case 'navigate':
          if (!step.target_url) throw new Error('navigate requires target_url');
          await this.page.goto(step.target_url, { waitUntil: 'networkidle' });
          break;

        case 'click': {
          const locator = await this.resolveTarget(step);
          if (stealth.humanize) {
            await humanClick(this.page, locator, step.step_id);
          } else {
            await locator.click();
          }
          break;
        }

        case 'type': {
          const locator = await this.resolveTarget(step);
          let value = step.input_value ?? '';
          for (const [k, v] of this.variables) {
            value = value.replace(`{{${k}}}`, v);
          }
          if (stealth.humanize) {
            await humanType(this.page, locator, value, stealth.typing_speed_wpm);
          } else {
            await locator.fill(value);
          }
          break;
        }

        case 'extract': {
          const locator = await this.resolveTarget(step);
          const text = await locator.textContent();
          if (step.variable_name && text) {
            this.variables.set(step.variable_name, text.trim());
          }
          break;
        }

        case 'press':
          if (!step.target_key) throw new Error('press requires target_key');
          await this.page.keyboard.press(step.target_key);
          break;

        case 'wait':
          await this.page.waitForTimeout(parseInt(step.input_value ?? '1000'));
          break;

        case 'scroll':
          await this.page.mouse.wheel(0, parseInt(step.input_value ?? '300'));
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      // Screenshot after
      if (step.audit?.screenshot_after) {
        const buffer = await this.page.screenshot({ type: 'png', fullPage: false });
        const upload = await uploadScreenshot(this.sessionId, step.step_id, Buffer.from(buffer), 'after');
        
        await this.sentinel.log({
          session_id: this.sessionId,
          step_id: step.step_id,
          event_type: 'STEP_EXECUTION',
          action: 'SCREENSHOT_AFTER',
          status: 'success',
          details: { screenshot_url: upload.url, s3_key: upload.key }
        });
      }

      await this.sentinel.log({
        session_id: this.sessionId,
        workflow_id: this.workflowId,
        step_id: step.step_id,
        event_type: 'STEP_EXECUTION',
        action: step.action.toUpperCase(),
        status: 'success',
        processing_time_ms: Date.now() - startTime
      });

    } catch (error) {
      await this.sentinel.log({
        session_id: this.sessionId,
        workflow_id: this.workflowId,
        step_id: step.step_id,
        event_type: 'STEP_FAILURE',
        action: step.action.toUpperCase(),
        status: 'failure',
        severity: 'error',
        details: { error: (error as Error).message }
      });
      throw error;
    }
  }
}
