const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    const missing = [];
    if (!clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!callbackUrl) missing.push('GOOGLE_CALLBACK_URL');
    throw new Error(`Gmail OAuth misconfigured. Missing env vars: ${missing.join(', ')}`);
  }
  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl);
}

router.get('/auth', (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    res.redirect(url);
  } catch (err) {
    console.error('Gmail auth error:', err.message);
    res.redirect(`${FRONTEND}?error=gmail_failed`);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    req.session.googleTokens = tokens;

    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos'
    });

    req.session.googleProfile = {
      name: profile.data.names?.[0]?.displayName,
      email: profile.data.emailAddresses?.[0]?.value,
      photo: profile.data.photos?.[0]?.url
    };

    res.redirect(`${FRONTEND}/dashboard?gmail=connected`);
  } catch (err) {
    console.error('Gmail auth error:', err.message);
    res.redirect(`${FRONTEND}?error=gmail_failed`);
  }
});

router.get('/data', async (req, res) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({ error: 'Gmail not connected' });
  }

  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(req.session.googleTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const threadList = await gmail.users.threads.list({
      userId: 'me',
      q: 'subject:(interview OR offer OR hiring OR recruiter OR "job opportunity" OR "software engineer" OR internship)',
      maxResults: 30
    });

    const threads = [];

    if (threadList.data.threads) {
      for (const thread of threadList.data.threads.slice(0, 15)) {
        try {
          const detail = await gmail.users.threads.get({
            userId: 'me',
            id: thread.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date']
          });

          const headers = detail.data.messages?.[0]?.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          threads.push({
            id: thread.id,
            subject,
            from,
            date,
            messagesCount: detail.data.messages?.length || 1,
            snippet: detail.data.messages?.[0]?.snippet || ''
          });
        } catch (e) {
          // skip individual thread errors
        }
      }
    }

    res.json({
      connected: true,
      profile: req.session.googleProfile,
      threads,
      totalJobThreads: threads.length
    });

  } catch (err) {
    console.error('Gmail data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;