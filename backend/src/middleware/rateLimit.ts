import rateLimit from 'express-rate-limit';

// Graceful: Use in-memory store by default.
// In production (Docker), Redis will be available and used automatically.
// validate.xForwardedForHeader=false suppresses Railway proxy ValidationError
// (Railway sets X-Forwarded-For; app.set('trust proxy', 1) is set in index.ts)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => req.ip || 'unknown'
});
