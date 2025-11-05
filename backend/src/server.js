import http from 'node:http';
import { config } from './config/env.js';
import { createApp } from './app.js';
import { getDriver } from './data/neo4jClient.js';

async function start() {
  const app = createApp();
  await ensureDatabaseConnection();
  const server = http.createServer(app);
  server.listen(config.port, () => {
    console.log(`API server listening on port ${config.port}`);
  });
}

async function ensureDatabaseConnection() {
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    console.log('Connected to Neo4j');
  } catch (error) {
    console.warn('Could not verify Neo4j connectivity:', error.message);
  }
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
