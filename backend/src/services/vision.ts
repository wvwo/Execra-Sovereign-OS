import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const VISION_URL = process.env.VISION_URL || 'http://vision:8000';

export async function analyzeVideo(videoPath: string, sessionId: string) {
  const form = new FormData();
  form.append('file', fs.createReadStream(videoPath));
  form.append('session_id', sessionId);

  const response = await axios.post(`${VISION_URL}/api/v1/vision/analyze`, form, {
    headers: form.getHeaders(),
    timeout: 300000 // 5 minutes max
  });

  return response.data;
}
