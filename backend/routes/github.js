const express = require('express');
const router = express.Router();
const { runCoralMultiple } = require('../coral');

router.get('/data', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const username = req.user.username;
  console.log(`\n Fetching GitHub data for: ${username}`);

  const results = runCoralMultiple({
    profile: `SELECT login, name, bio, followers, following, public_repos, created_at FROM github.user WHERE username = '${username}'`,
    repos: `SELECT name, description, language, stargazers_count, forks_count, open_issues_count, pushed_at, created_at FROM github.user_repos LIMIT 30`,
    commits: `SELECT sha, commit, html_url FROM github.commits WHERE owner = '${username}' AND repo = (SELECT name FROM github.user_repos ORDER BY pushed_at DESC LIMIT 1) LIMIT 50`,
    prs: `SELECT title, state, created_at, merged_at, html_url FROM github.pull_requests WHERE owner = '${username}' AND repo = (SELECT name FROM github.user_repos ORDER BY pushed_at DESC LIMIT 1) LIMIT 20`,
    languages: `SELECT language, COUNT(*) as count FROM github.user_repos WHERE language IS NOT NULL GROUP BY language ORDER BY count DESC`
  });

  res.json({
    username,
    avatar: req.user.avatar,
    displayName: req.user.displayName,
    ...results
  });
});

module.exports = router;