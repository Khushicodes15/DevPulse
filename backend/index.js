require('dotenv').config();
const express = require('express');

console.log('\n[ENV] OAuth Configuration Check:');
console.log(`[ENV]   GOOGLE_CLIENT_ID exists: ${!!process.env.GOOGLE_CLIENT_ID}`);
console.log(`[ENV]   GOOGLE_CLIENT_SECRET exists: ${!!process.env.GOOGLE_CLIENT_SECRET}`);
console.log(`[ENV]   GOOGLE_CALLBACK_URL exists: ${!!process.env.GOOGLE_CALLBACK_URL}`);
console.log(`[ENV]   GITHUB_CLIENT_ID exists: ${!!process.env.GITHUB_CLIENT_ID}`);
console.log(`[ENV]   GITHUB_CLIENT_SECRET exists: ${!!process.env.GITHUB_CLIENT_SECRET}`);
console.log(`[ENV]   GITHUB_CALLBACK_URL exists: ${!!process.env.GITHUB_CALLBACK_URL}\n`);

const cors = require('cors');
const session = require('express-session');
const passport = require('./auth/github');
const { getMcpClient } = require('./coral-mcp');
const githubRoutes = require('./routes/github');
const gmailRoutes = require('./routes/gmail');
const analyzeRoutes = require('./routes/analyze');

const app = express();

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      FRONTEND,
      'http://localhost:5173',
      'https://dev-pulse-blush-three.vercel.app'
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'devpulse_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Inject user from sid BEFORE all routes ────────────────────────────────────
// sid always takes priority over any cookie-based session so different users
// on the same browser don't bleed into each other's sessions.
app.use((req, res, next) => {
  const sid = req.query.sid || req.headers['x-session-id'];
  if (!sid) return next(); // no sid → rely on passport.session() cookie as-is
  req.sessionStore.get(sid, (err, sessionData) => {
    if (err || !sessionData?.passport?.user) { req.user = null; return next(); }
    req.user = sessionData.passport.user;
    req.session.googleTokens = sessionData.googleTokens;
    req.session.googleProfile = sessionData.googleProfile;
    next();
  });
});

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user', 'repo', 'read:org'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND}?error=github_failed` }),
  (req, res) => {
    res.redirect(`${FRONTEND}/scanning?sid=${req.sessionID}`);
  }
);

app.get('/auth/google', (req, res) => res.redirect('/auth/gmail'));

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.json({ success: true });
  });
});

// ── User Status ───────────────────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (!req.user) return res.json({ authenticated: false });
  res.json({
    authenticated: true,
    user: {
      username: req.user.username,
      displayName: req.user.displayName,
      avatar: req.user.avatar
    },
    gmail: !!req.session.googleTokens,
    gmailProfile: req.session.googleProfile || null
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/auth/gmail', gmailRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/analyze', analyzeRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'DevPulse backend running',
    timestamp: new Date().toISOString(),
    authenticated: !!req.user
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n DevPulse backend running on port ${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(` GitHub:   http://localhost:${PORT}/auth/github`);
  console.log(` Gmail:    http://localhost:${PORT}/auth/gmail/auth\n`);
});

getMcpClient().catch(err => console.error('MCP pre-warm failed:', err.message));