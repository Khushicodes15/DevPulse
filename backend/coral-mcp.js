const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

let mcpClient = null;

async function getMcpClient() {
  if (mcpClient) return mcpClient;

  // On Railway: CORAL_BIN=/app/coral (single binary, no spaces)
  // Locally on Windows: falls back to wsl command
  const coralBin = process.env.CORAL_BIN || 'wsl -d Ubuntu -e env CORAL_CONFIG_DIR=/home/user/cassandra-hackathon /home/user/.local/bin/coral';
  const parts = coralBin.split(' ');
  const command = parts[0];
  const args = [...parts.slice(1), 'mcp-stdio'];

  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env,
      CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR,
    }
  });

  mcpClient = new Client(
    { name: 'devpulse', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);

  const toolList = await mcpClient.listTools();
  console.log('  Coral MCP client connected');
  console.log('  Available MCP tools:', JSON.stringify(toolList.tools.map(t => t.name)));
  return mcpClient;
}

async function mcpQuery(sql) {
  try {
    const client = await getMcpClient();
    const result = await client.callTool({
      name: 'sql',
      arguments: { sql }
    });
    const text = result.content?.[0]?.text || '[]';
    return { success: true, data: JSON.parse(text) };
  } catch (err) {
    console.error('MCP query error:', err.message);
    return { success: false, data: [], error: err.message };
  }
}

async function mcpQueryMultiple(queries) {
  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    console.log(`  MCP querying: ${key}...`);
    results[key] = await mcpQuery(sql);
  }
  return results;
}

async function closeMcpClient() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }
}

module.exports = { getMcpClient, mcpQuery, mcpQueryMultiple, closeMcpClient };