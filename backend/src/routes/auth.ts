import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { setAuthCookie } from '../middleware/auth';
import { prisma } from '../utils/prismaClient';

const router = Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || (() => { throw new Error('GOOGLE_CLIENT_ID is required'); })(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || (() => { throw new Error('GOOGLE_CLIENT_SECRET is required'); })(),
    callbackURL: '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails![0].value,
          name: profile.displayName,
          avatar: profile.photos?.[0].value
        }
      });
    }
    
    done(null, user);
  }
));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user as any;
    setAuthCookie(res, user.id);
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ status: 'logged_out' });
});

export default router;
