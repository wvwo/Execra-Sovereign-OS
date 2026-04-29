import { URL } from 'url';

// CIDR ranges blocked for SSRF protection
const BLOCKED_PATTERNS = [
  // Loopback
  /^127\./,
  /^::1$/,
  /^localhost$/i,
  // Private IPv4 (RFC 1918)
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // Link-local / APIPA
  /^169\.254\./,
  /^fe80:/i,
  // AWS metadata
  /^169\.254\.169\.254$/,
  // GCP metadata
  /^metadata\.google\.internal$/i,
  // Docker / Kubernetes internal
  /^172\.(1[6-9]|2\d|3[01])\./,
];

const BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.google',
  'metadata',
  '169.254.169.254',
  '100.100.100.200', // Alibaba Cloud metadata
]);

export class SSRFError extends Error {
  constructor(url: string) {
    super(`SSRF blocked: target URL "${url}" resolves to a private or restricted address`);
    this.name = 'SSRFError';
  }
}

export function assertSafeUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SSRFError(rawUrl);
  }

  // Only allow HTTP(S)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SSRFError(rawUrl);
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(host)) {
    throw new SSRFError(rawUrl);
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(host)) {
      throw new SSRFError(rawUrl);
    }
  }
}

export function sanitizeWorkflowUrls(steps: unknown[]): void {
  if (!Array.isArray(steps)) return;
  for (const step of steps) {
    if (step && typeof step === 'object' && 'target_url' in step) {
      const s = step as { target_url?: string };
      if (s.target_url) assertSafeUrl(s.target_url);
    }
  }
}
