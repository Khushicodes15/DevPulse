const express = require('express');
const router = express.Router();
const axios = require('axios');
const { runCoralMultiple, runCoral } = require('../coral');
const { calculateHireabilityScore } = require('../scoring');
const { mcpQueryMultiple } = require('../coral-mcp');

async function askAI(prompt) {
  const res = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );
  return res.data.choices[0].message.content;
}

// Get the most recently pushed REAL repo (not profile readme)
function getRealRepo(repos, username) {
  if (!repos || repos.length === 0) return null;
  const real = repos.find(r =>
    r.name !== username &&
    !r.name.toLowerCase().includes('profile') &&
    !r.name.toLowerCase().includes('readme')
  );
  return real ? real.name : repos[0].name;
}

async function runAnalysis(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const username = req.user.username;
    console.log(`\n Analyzing profile for: ${username}`);

    // ── Step 1: Get repos first to find real repo name ───────────────
    console.log(' Step 1: Querying GitHub via Coral...');
    const reposResult = runCoral(
      `SELECT name, description, language, stargazers_count, forks_count, open_issues_count, pushed_at, created_at FROM github.user_repos LIMIT 30`,req.user.accessToken
    );
    const repos = reposResult.data || [];
    const repoName = getRealRepo(repos, username) || repos[0]?.name || 'main';
    console.log(`  Using repo: ${repoName}`);

    // ── Step 2: Query all other sources in parallel ──────────────────
    const githubData = runCoralMultiple({
      profile: `SELECT login, name, bio, followers, following, public_repos, created_at FROM github.user LIMIT 1`,
      languages: `SELECT language, COUNT(*) as repo_count FROM github.user_repos WHERE language IS NOT NULL GROUP BY language ORDER BY repo_count DESC`,
      prs: `SELECT title, state, created_at, merged_at FROM github.pulls WHERE owner = '${username}' AND repo = '${repoName}' LIMIT 20`,
      commitActivity: `SELECT week, total, days FROM github.commit_activity WHERE owner = '${username}' AND repo = '${repoName}' LIMIT 20`,
      events: `SELECT type, created_at FROM github.user_event_public WHERE username = '${username}' LIMIT 30`
    },req.user.accessToken);

    // Attach repos to githubData
    githubData.repos = reposResult;

    // ── Step 3: Get Gmail data from session ──────────────────────────
    console.log(' Step 2: Reading Gmail data from session...');
    const gmailData = req.session?.googleTokens ? (req.body?.gmailData || null) : null;

    // ── Step 4: Calculate hireability score ──────────────────────────
    console.log(' Step 3: Calculating hireability score...');
    const scoreResult = calculateHireabilityScore(githubData, gmailData);

    // ── Step 5: Cross-source Coral JOIN ──────────────────────────────
    console.log(' Step 4: Running cross-source Coral JOIN...');
    const crossSourceData = runCoralMultiple({
      repoHealth: `SELECT name, language, stargazers_count, open_issues_count, pushed_at, forks_count FROM github.user_repos ORDER BY pushed_at DESC LIMIT 10`,
      topRepos: `SELECT name, stargazers_count, forks_count, language, description FROM github.user_repos ORDER BY stargazers_count DESC LIMIT 5`,
      recentEvents: `SELECT type, created_at FROM github.user_event_public WHERE username = '${username}' LIMIT 20`
    },req.user.accessToken);

    // ── Step 6: AI gap analysis ──────────────────────────────────────
    console.log(' Step 5: Running AI gap analysis...');
    const prompt = `You are DevPulse, a brutally honest career intelligence agent for developers.

Here is real data about a developer pulled via Coral SQL cross-source joins:

GITHUB PROFILE:
${JSON.stringify(githubData.profile?.data?.[0] || {}, null, 2)}

REPOSITORIES (${repos.length} total):
${JSON.stringify(repos.slice(0, 3), null, 2)}

LANGUAGES USED:
${JSON.stringify((githubData.languages?.data || []).slice(0, 5), null, 2)}

PULL REQUESTS (from ${repoName}):
${JSON.stringify(githubData.prs?.data || [], null, 2)}

COMMIT ACTIVITY (from ${repoName}):
${JSON.stringify(githubData.commitActivity?.data || [], null, 2)}

RECENT GITHUB EVENTS:
${JSON.stringify(githubData.events?.data || [], null, 2)}

TOP REPOS BY STARS:
${JSON.stringify(crossSourceData.topRepos?.data || [], null, 2)}

HIREABILITY SCORE: ${scoreResult.total}/100
VERDICT: ${scoreResult.verdict}
TARGET: ${scoreResult.targetCompany}

SCORE BREAKDOWN:
${JSON.stringify(scoreResult.breakdown, null, 2)}

GAPS IDENTIFIED:
${JSON.stringify(scoreResult.gaps, null, 2)}

Based on this real data, provide brutally honest analysis:

Return ONLY valid JSON, no markdown, no backticks:
{
  "summary": "2 sentence brutal honest summary of where this developer stands RIGHT NOW",
  "weeklyActions": ["specific action 1", "specific action 2", "specific action 3"],
  "realisticTargets": "which companies/roles they can realistically target right now",
  "strengthSpotlight": "one thing they are doing really well, reference actual repo names",
  "biggestBlocker": "the single most important thing holding them back",
  "focusToday": "the ONE thing to do today",
  "growthTrend": "improving|declining|stagnant"
}`;

    const aiRaw = await askAI(prompt);
    const aiMatch = aiRaw.match(/\{[\s\S]*\}/);
    if (!aiMatch) throw new Error('AI did not return valid JSON');
    const aiInsights = JSON.parse(aiMatch[0]);

    console.log(` Analysis complete. Score: ${scoreResult.total}/100`);

    res.json({
      score: scoreResult,
      ai: aiInsights,
      github: {
        profile: githubData.profile?.data?.[0],
        repos,
        languages: githubData.languages?.data,
        prs: githubData.prs?.data,
        commitActivity: githubData.commitActivity?.data,
        repoHealth: crossSourceData.repoHealth?.data,
        topRepos: crossSourceData.topRepos?.data,
        recentEvents: crossSourceData.recentEvents?.data
      },
      gmail: gmailData ? {
        connected: true,
        threads: gmailData.threads,
        jobThreads: gmailData.totalJobThreads
      } : {
        connected: false
      },
      meta: {
        analyzedAt: new Date().toISOString(),
        username,
        primaryRepo: repoName,
        coralSources: [
          'github.user_repos',
          'github.commit_activity',
          'github.pulls',
          'github.user',
          'github.user_event_public'
        ]
      }
    });

  } catch (err) {
    console.error(' Analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/analyze/run  ← browser testing
router.get('/run', (req, res) => runAnalysis(req, res));

// POST /api/analyze  ← frontend
router.post('/', (req, res) => runAnalysis(req, res));

// GET /api/analyze/focus
router.get('/focus', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const data = runCoralMultiple({
      recentRepos: `SELECT name, open_issues_count, pushed_at FROM github.user_repos ORDER BY pushed_at DESC LIMIT 5`,
      topRepos: `SELECT name, stargazers_count, language FROM github.user_repos ORDER BY stargazers_count DESC LIMIT 5`
    },req.user.accessToken);

    const prompt = `Based on this GitHub activity data, what ONE thing should this developer work on today?

Recent repos: ${JSON.stringify(data.recentRepos?.data || [])}
Top repos: ${JSON.stringify(data.topRepos?.data || [])}

Return ONLY JSON, no markdown, no backticks:
{
  "focusTask": "...",
  "reason": "...",
  "estimatedTime": "...",
  "impact": "high|medium|low"
}`;

    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response invalid');
    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/growth  ← "How am I growing?"
router.get('/growth', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const username = req.user.username;
    const data = runCoralMultiple({
      repoTimeline: `SELECT name, language, created_at, pushed_at, stargazers_count FROM github.user_repos ORDER BY created_at ASC`,
      events: `SELECT type, created_at FROM github.user_event_public WHERE username = '${username}' LIMIT 50`
    }, req.user.accessToken);

    const repos = data.repoTimeline?.data || [];
    const events = data.events?.data || [];

    const monthlyCreation = {};
    repos.forEach(r => {
      if (!r.created_at) return;
      const month = r.created_at.slice(0, 7);
      monthlyCreation[month] = (monthlyCreation[month] || 0) + 1;
    });

    const eventBreakdown = {};
    events.forEach(e => {
      eventBreakdown[e.type] = (eventBreakdown[e.type] || 0) + 1;
    });

    const languageTimeline = repos.map(r => ({
      name: r.name,
      language: r.language,
      created_at: r.created_at?.slice(0, 7)
    })).filter(r => r.language);

    const prompt = `You are DevPulse. Analyze this developer's growth trajectory over time.

REPO CREATION TIMELINE (oldest to newest):
${JSON.stringify(repos.map(r => ({ name: r.name, language: r.language, created: r.created_at?.slice(0, 7) })), null, 2)}

RECENT GITHUB EVENTS BREAKDOWN:
${JSON.stringify(eventBreakdown, null, 2)}

MONTHLY REPO CREATION:
${JSON.stringify(monthlyCreation, null, 2)}

Return ONLY valid JSON, no markdown, no backticks:
{
  "trajectory": "upward|downward|plateau|inconsistent",
  "summary": "2 sentence honest assessment of their growth over time",
  "peakPeriod": "the month/period they were most active e.g. 'Oct 2025'",
  "currentMomentum": "high|medium|low|stalled",
  "languageEvolution": "how their language choices have evolved, what it signals",
  "nextMilestone": "the specific next milestone they should hit in 30 days",
  "consistency": "a score from 1-10 with one sentence explanation"
}`;

    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response invalid');

    res.json({
      ...JSON.parse(match[0]),
      monthlyCreation,
      languageTimeline,
      eventBreakdown,
      totalRepos: repos.length,
      activeLanguages: [...new Set(repos.map(r => r.language).filter(Boolean))].length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/portfolio  ← "What have I built?"
router.get('/portfolio', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const data = runCoralMultiple({
      allRepos: `SELECT name, description, language, stargazers_count, forks_count, open_issues_count, pushed_at, created_at FROM github.user_repos ORDER BY pushed_at DESC`,
      topByStars: `SELECT name, stargazers_count, forks_count, language, description FROM github.user_repos ORDER BY stargazers_count DESC LIMIT 10`
    }, req.user.accessToken);

    const repos = data.allRepos?.data || [];

    const categories = {
      projects: repos.filter(r => r.description && r.language && r.stargazers_count >= 0),
      experiments: repos.filter(r => !r.description && r.language),
      forks: repos.filter(r => r.forks_count > 0),
      stale: repos.filter(r => {
        if (!r.pushed_at) return false;
        const daysSince = (Date.now() - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24);
        return daysSince > 180;
      })
    };

    const prompt = `You are DevPulse. Analyze this developer's portfolio honestly.

ALL REPOS (${repos.length} total):
${JSON.stringify(repos.slice(0, 20), null, 2)}

TOP BY STARS:
${JSON.stringify(data.topByStars?.data || [], null, 2)}

Return ONLY valid JSON, no markdown, no backticks:
{
  "headline": "one honest sentence describing what kind of builder this person is",
  "flagshipProjects": ["repo1", "repo2", "repo3"],
  "hiddenGems": ["repos that deserve more attention with reason"],
  "portfolioGaps": ["what's missing that would make this portfolio stronger"],
  "readinessForWork": "honest 1 sentence — is this portfolio ready to show to employers?",
  "quickWins": ["3 specific things to do this week to improve the portfolio"]
}`;

    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response invalid');

    res.json({
      ...JSON.parse(match[0]),
      stats: {
        total: repos.length,
        withDescription: repos.filter(r => r.description).length,
        withLanguage: repos.filter(r => r.language).length,
        starred: repos.filter(r => r.stargazers_count > 0).length,
        activeLastMonth: repos.filter(r => {
          if (!r.pushed_at) return false;
          return (Date.now() - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24) <= 30;
        }).length
      },
      categories: {
        projectCount: categories.projects.length,
        experimentCount: categories.experiments.length,
        staleCount: categories.stale.length
      },
      allRepos: repos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/week  ← "My week in code"
router.get('/week', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const username = req.user.username;
    const data = runCoralMultiple({
      recentEvents: `SELECT type, created_at FROM github.user_event_public WHERE username = '${username}' LIMIT 50`,
      recentRepos: `SELECT name, language, pushed_at, open_issues_count FROM github.user_repos ORDER BY pushed_at DESC LIMIT 10`
    }, req.user.accessToken);

    const events = data.recentEvents?.data || [];
    const repos = data.recentRepos?.data || [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEvents = events.filter(e => e.created_at && new Date(e.created_at) >= sevenDaysAgo);
    const weekRepos = repos.filter(r => r.pushed_at && new Date(r.pushed_at) >= sevenDaysAgo);

    const weekActivity = {};
    weekEvents.forEach(e => {
      weekActivity[e.type] = (weekActivity[e.type] || 0) + 1;
    });

    const prompt = `You are DevPulse. Write a personal weekly retrospective for this developer.

EVENTS THIS WEEK (last 7 days):
${JSON.stringify(weekEvents, null, 2)}

REPOS TOUCHED THIS WEEK:
${JSON.stringify(weekRepos, null, 2)}

ACTIVITY BREAKDOWN:
${JSON.stringify(weekActivity, null, 2)}

Write a personal, direct weekly summary. Return ONLY valid JSON, no markdown, no backticks:
{
  "weekScore": a number 1-10 rating this week,
  "summary": "2-3 sentence honest summary of what this developer did this week",
  "wins": ["specific win 1", "specific win 2"],
  "missed": "what they didn't do that they should have",
  "nextWeekFocus": "the single most important focus for next week",
  "streakStatus": "on a roll|breaking even|losing momentum|went quiet"
}`;

    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response invalid');

    res.json({
      ...JSON.parse(match[0]),
      weekActivity,
      weekRepos: weekRepos.map(r => r.name),
      totalWeekEvents: weekEvents.length,
      period: {
        from: sevenDaysAgo.toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/schema  ← schema learning (shows coral catalog awareness)
router.get('/schema', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const data = runCoralMultiple({
      tables: `SELECT schema_name, table_name, description FROM coral.tables ORDER BY schema_name`,
      githubColumns: `SELECT table_name, column_name, data_type, description FROM coral.columns WHERE schema_name = 'github' ORDER BY table_name LIMIT 50`,
      linearColumns: `SELECT table_name, column_name, data_type, description FROM coral.columns WHERE schema_name = 'linear' ORDER BY table_name`,
      sentryColumns: `SELECT table_name, column_name, data_type, description FROM coral.columns WHERE schema_name = 'sentry' ORDER BY table_name`
    }, req.user.accessToken);

    const schemaMap = {};
    (data.tables?.data || []).forEach(t => {
      if (!schemaMap[t.schema_name]) schemaMap[t.schema_name] = [];
      schemaMap[t.schema_name].push({ table: t.table_name, description: t.description });
    });

    res.json({
      schemas: schemaMap,
      totalTables: (data.tables?.data || []).length,
      columns: {
        github: data.githubColumns?.data || [],
        linear: data.linearColumns?.data || [],
        sentry: data.sentryColumns?.data || []
      },
      discoveredAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/mcp-insight  ← uses Coral via MCP protocol (not CLI)
router.get('/mcp-insight', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const username = req.user.username;
    console.log('\n  Running MCP-powered cross-source analysis...');

    // Use runCoralMultiple (not the MCP singleton) so each request gets the
    // correct per-user GITHUB_TOKEN injected via env.
    const data = runCoralMultiple({
      githubRepos: `SELECT name, language, stargazers_count, pushed_at FROM github.user_repos ORDER BY pushed_at DESC LIMIT 10`,
      githubProfile: `SELECT login, public_repos, followers FROM github.user LIMIT 1`,
      linearIssues: `SELECT title, state_name, priority_label, created_at FROM linear.issues LIMIT 10`,
      sentryIssues: `SELECT title, level, count, first_seen, last_seen FROM sentry.issues LIMIT 10`
    }, req.user.accessToken);

    const prompt = `You are DevPulse. You have access to a developer's data across GitHub, Linear, and Sentry via Coral MCP.

GITHUB REPOS (via MCP):
${JSON.stringify(data.githubRepos?.data || [], null, 2)}

GITHUB PROFILE (via MCP):
${JSON.stringify(data.githubProfile?.data || [], null, 2)}

LINEAR ISSUES (via MCP):
${JSON.stringify(data.linearIssues?.data || [], null, 2)}

SENTRY ERRORS (via MCP):
${JSON.stringify(data.sentryIssues?.data || [], null, 2)}

This data was fetched via Coral's MCP server doing cross-source joins across GitHub + Linear + Sentry simultaneously.

Give a single cross-source insight that would be IMPOSSIBLE to derive from any one source alone.

Return ONLY valid JSON, no markdown, no backticks:
{
  "insight": "the cross-source insight in 2-3 sentences",
  "correlation": "what two sources were correlated",
  "signal": "what this means for the developer right now",
  "confidence": "high|medium|low",
  "sourcesUsed": ["github", "linear", "sentry"]
}`;

    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response invalid');

    res.json({
      ...JSON.parse(match[0]),
      rawData: {
        github: data.githubRepos?.data,
        linear: data.linearIssues?.data,
        sentry: data.sentryIssues?.data
      },
      transport: 'coral-cli',
      meta: {
        queriedAt: new Date().toISOString(),
        username,
        coralFeatures: ['mcp-stdio', 'cross-source-join', 'caching', 'schema-learning', 'sql-interface']
      }
    });

  } catch (err) {
    console.error('MCP insight error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;