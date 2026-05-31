function calculateHireabilityScore(githubData, gmailData) {
  const scores = {
    consistency: 0,    // max 25
    projectQuality: 0, // max 25
    activity: 0,       // max 20
    diversity: 0,      // max 15
    collaboration: 0,  // max 15
  };

  const evidence = {};

  // ── CONSISTENCY (25pts) ──────────────────────────────────────────────
  const repos = githubData.repos?.data || [];
  const recentRepos = repos.filter(r => {
    const lastPush = new Date(r.pushed_at);
    const daysAgo = (Date.now() - lastPush) / (1000 * 60 * 60 * 24);
    return daysAgo <= 90;
  });

  const consistencyRatio = repos.length > 0 ? recentRepos.length / repos.length : 0;
  scores.consistency = Math.round(consistencyRatio * 25);
  evidence.consistency = {
    score: scores.consistency,
    max: 25,
    detail: `${recentRepos.length} of ${repos.length} repos active in last 90 days`,
    repos: recentRepos.map(r => r.name)
  };

  // ── PROJECT QUALITY (25pts) ──────────────────────────────────────────
  const staredRepos = repos.filter(r => r.stargazers_count > 0);
  const reposWithDesc = repos.filter(r => r.description && r.description.length > 10);
  const qualityRatio = repos.length > 0
    ? (staredRepos.length * 0.6 + reposWithDesc.length * 0.4) / repos.length
    : 0;
  scores.projectQuality = Math.min(25, Math.round(qualityRatio * 35));
  evidence.projectQuality = {
    score: scores.projectQuality,
    max: 25,
    detail: `${staredRepos.length} starred repos, ${reposWithDesc.length} with descriptions`,
    topRepos: staredRepos.slice(0, 3).map(r => ({ name: r.name, stars: r.stargazers_count }))
  };

  // ── ACTIVITY (20pts) ─────────────────────────────────────────────────
  const commits = githubData.commits?.data || [];
  const recentCommits = commits.filter(c => {
    const date = new Date(c.commit?.author?.date || c.created_at);
    const daysAgo = (Date.now() - date) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const activityScore = Math.min(20, recentCommits.length * 2);
  scores.activity = activityScore;
  evidence.activity = {
    score: scores.activity,
    max: 20,
    detail: `${recentCommits.length} commits in last 30 days`,
    lastCommit: commits[0]?.commit?.author?.date || 'unknown'
  };

  // ── DIVERSITY (15pts) ────────────────────────────────────────────────
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
  const diversityScore = Math.min(15, languages.length * 2.5);
  scores.diversity = Math.round(diversityScore);
  evidence.diversity = {
    score: scores.diversity,
    max: 15,
    detail: `${languages.length} programming languages used`,
    languages
  };

  // ── COLLABORATION (15pts) ────────────────────────────────────────────
  const prs = githubData.prs?.data || [];
  const followers = githubData.profile?.data?.[0]?.followers || 0;
  const collabScore = Math.min(15, prs.length * 1.5 + Math.min(5, followers * 0.1));
  scores.collaboration = Math.round(collabScore);
  evidence.collaboration = {
    score: scores.collaboration,
    max: 15,
    detail: `${prs.length} pull requests, ${followers} GitHub followers`,
  };

  // ── GMAIL BONUS (up to +10) ──────────────────────────────────────────
  let gmailBonus = 0;
  const gmailEvidence = {};

  if (gmailData) {
    const threads = gmailData.threads || [];
    const jobThreads = threads.filter(t =>
      /interview|offer|hiring|recruiter|position|role|opportunity/i.test(t.snippet || '')
    );
    const responses = jobThreads.filter(t => t.messagesCount > 1);
    gmailBonus = Math.min(10, responses.length * 2);
    gmailEvidence.jobThreads = jobThreads.length;
    gmailEvidence.responses = responses.length;
    gmailEvidence.bonus = gmailBonus;
  }

  // ── FINAL SCORE ──────────────────────────────────────────────────────
  const rawTotal = Object.values(scores).reduce((a, b) => a + b, 0);
  const total = Math.min(100, rawTotal + gmailBonus);

  // ── GAPS ─────────────────────────────────────────────────────────────
  const gaps = [];

  if (scores.consistency < 15)
    gaps.push({ area: 'Consistency', gap: 'Less than half your repos were touched in 90 days. Recruiters check recency.', priority: 'High' });
  if (scores.projectQuality < 12)
    gaps.push({ area: 'Project Quality', gap: 'Most repos have no stars and no descriptions. Add READMEs and polish 2-3 flagship projects.', priority: 'High' });
  if (scores.activity < 10)
    gaps.push({ area: 'Activity', gap: `Only ${evidence.activity.detail}. Aim for at least 10 commits per month.`, priority: 'High' });
  if (scores.diversity < 8)
    gaps.push({ area: 'Diversity', gap: 'Limited language diversity. Learn one new language or framework this month.', priority: 'Medium' });
  if (scores.collaboration < 8)
    gaps.push({ area: 'Collaboration', gap: 'Few pull requests and low followers. Contribute to open source — even small fixes count.', priority: 'Medium' });

  // ── VERDICT ──────────────────────────────────────────────────────────
  let verdict, targetCompany;
  if (total >= 80) {
    verdict = 'Strong candidate';
    targetCompany = 'FAANG / top-tier startups';
  } else if (total >= 60) {
    verdict = 'Hireable now';
    targetCompany = 'Mid-stage startups and product companies';
  } else if (total >= 40) {
    verdict = 'Getting there';
    targetCompany = 'Early-stage startups and internships';
  } else {
    verdict = 'Not ready yet';
    targetCompany = 'Focus on building first';
  }

  return {
    total,
    verdict,
    targetCompany,
    breakdown: scores,
    evidence,
    gaps,
    gmailEvidence,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { calculateHireabilityScore };