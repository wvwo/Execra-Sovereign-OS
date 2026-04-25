import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'autopilot',
    secretAccessKey: process.env.S3_SECRET_KEY || 'autopilot-secure-123'
  },
  forcePathStyle: true
});

const BUCKET = process.env.S3_BUCKET || 'autopilot-screenshots';
const URL_EXPIRY = parseInt(process.env.S3_URL_EXPIRY || '3600');

export async function uploadScreenshot(
  sessionId: string,
  stepId: number,
  buffer: Buffer,
  type: 'before' | 'after'
): Promise<{ key: string; url: string }> {
  const key = `screenshots/${sessionId}/step-${stepId}-${type}.png`;
  
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    Metadata: {
      'session-id': sessionId,
      'step-id': String(stepId),
      'type': type
    }
  }));
  
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  }), { expiresIn: URL_EXPIRY });
  
  return { key, url };
}

export async function getScreenshotUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  }), { expiresIn: URL_EXPIRY });
}
