require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./auth/github');
const { getMcpClient } = require('./coral-mcp');
const githubRoutes = require('./routes/github');
const gmailRoutes = require('./routes/gmail');
const analyzeRoutes = require('./routes/analyze');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user', 'repo', 'read:org'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173?error=github_failed' }),
  (req, res) => {
    res.redirect('http://localhost:5173/scanning');
  }
);

app.get('/auth/google', (req, res) => {
  res.redirect('/auth/gmail');
});

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

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n DevPulse backend running on port ${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(` GitHub:   http://localhost:${PORT}/auth/github`);
  console.log(` Gmail:    http://localhost:${PORT}/auth/gmail/auth\n`);
});
// Pre-warm MCP connection
getMcpClient().catch(err => console.error('MCP pre-warm failed:', err.message));