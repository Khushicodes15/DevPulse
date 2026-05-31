const { execSync } = require('child_process');

function runCoral(sql) {
  try {
    const coralCmd = process.env.CORAL_BIN || 'coral';
    const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const result = execSync(`"${coralCmd}" sql --format json "${escaped}"`, {
      timeout: 120000,
      env: { ...process.env, CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR }
    });
    const parsed = JSON.parse(result.toString());
    return { success: true, data: parsed };
  } catch (err) {
    const message = err.message.split('\n')[0];
    console.error('Coral error:', message);
    return { success: false, data: [], error: message };
  }
}

function runCoralMultiple(queries) {
  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    console.log(`  Coral querying: ${key}...`);
    results[key] = runCoral(sql);
  }
  return results;
}

module.exports = { runCoral, runCoralMultiple };