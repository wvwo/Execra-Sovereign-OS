import rateLimit from 'express-rate-limit';

// Graceful: Use in-memory store by default.
// In production (Docker), Redis will be available and used automatically.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown'
});
