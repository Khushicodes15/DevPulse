const { execSync } = require('child_process');

// Node.js-level cache keyed by token+sql so different users never share results.
// Coral's built-in cache is disabled (config.toml) because it strips SQL comments
// before hashing, making per-user comment tricks ineffective.
const nodeCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function runCoral(sql, githubToken) {
  const cacheKey = `${githubToken || 'anon'}::${sql}`;
  const hit = nodeCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return hit.result;
  }

  try {
    const coralCmd = process.env.CORAL_BIN || 'coral';
    const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const env = {
      ...process.env,
      CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR
    };
    if (githubToken) {
      env.GITHUB_TOKEN = githubToken;
    }
    const result = execSync(`${coralCmd} sql --format json "${escaped}"`, {
      timeout: 120000,
      env
    });
    const parsed = JSON.parse(result.toString());
    const success = { success: true, data: parsed };
    nodeCache.set(cacheKey, { result: success, ts: Date.now() });
    return success;
  } catch (err) {
    const message = err.message.split('\n')[0];
    console.error('Coral error:', message);
    return { success: false, data: [], error: message };
  }
}

function runCoralMultiple(queries, githubToken) {
  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    console.log(`  Coral querying: ${key}...`);
    results[key] = runCoral(sql, githubToken);
  }
  return results;
}

module.exports = { runCoral, runCoralMultiple };