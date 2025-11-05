import neo4j from 'neo4j-driver';
import { config } from '../config/env.js';

let driver;

export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.username, config.neo4j.password),
      {
        disableLosslessIntegers: true
      }
    );
  }
  return driver;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function runQuery(query, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}
