const { execSync } = require('child_process');

function runCoral(sql, githubToken) {
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
    return { success: true, data: parsed };
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