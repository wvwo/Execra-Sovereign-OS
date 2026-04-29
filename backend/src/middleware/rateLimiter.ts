import rateLimit from 'express-rate-limit';

const windowMs = (minutes: number) => minutes * 60 * 1000;

// Auth: 5 attempts per 15 minutes (brute-force / credential-stuffing protection)
export const authLimiter = rateLimit({
  windowMs: windowMs(15),
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
  skipSuccessfulRequests: true,
});

// Video upload: 10 per hour
export const uploadLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Try again in an hour.' },
});

// LLM analysis / AI assist: 20 per hour
export const analysisLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Try again in an hour.' },
});

// Workflow execution: 100 per day
export const executionLimiter = rateLimit({
  windowMs: windowMs(60 * 24),
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily execution limit reached.' },
});

// General API: 300 per 15 minutes (fallback)
export const generalLimiter = rateLimit({
  windowMs: windowMs(15),
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
