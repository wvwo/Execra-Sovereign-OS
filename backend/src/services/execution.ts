import axios from 'axios';

const EXECUTION_URL = process.env.EXECUTION_URL || 'http://execution:4001';

export async function executeWorkflow(workflow: any) {
  const response = await axios.post(`${EXECUTION_URL}/api/v1/execute`, workflow, {
    timeout: 600000 // 10 minutes max
  });
  return response.data;
}
