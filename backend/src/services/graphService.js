import crypto from 'node:crypto';
import { runQuery } from '../data/neo4jClient.js';

const nodeSelection = `{
  id: toString(id(node)),
  label: coalesce(node.label, node.name, toString(id(node))),
  properties: properties(node)
}`;

const relationshipSelection = `{
  id: toString(id(rel)),
  sourceId: toString(id(startNode(rel))),
  targetId: toString(id(endNode(rel))),
  type: type(rel),
  properties: properties(rel)
}`;

export async function listGraph(limit = 50) {
  const query = `
    MATCH (node)
    WITH node LIMIT $limit
    OPTIONAL MATCH (node)-[rel]-()
    RETURN ${nodeSelection} AS node, collect(DISTINCT ${relationshipSelection}) AS relationships
  `;
  const records = await runQuery(query, { limit });
  const nodes = [];
  const links = new Map();

  for (const record of records) {
    const node = enrichNode(record.node);
    nodes.push(node);
    for (const rel of record.relationships) {
      links.set(rel.id, rel);
    }
  }

  return { nodes, links: Array.from(links.values()) };
}

export async function createNode({ label, properties = {} }) {
  const query = `
    CREATE (node:GraphNode $props)
    SET node.label = $label
    RETURN ${nodeSelection} AS node
  `;
  const [record] = await runQuery(query, { label, props: properties });
  return record ? enrichNode(record.node) : null;
}

export async function getNodeById(id) {
  const query = `
    MATCH (node)
    WHERE id(node) = toInteger($id)
    RETURN ${nodeSelection} AS node
  `;
  const [record] = await runQuery(query, { id });
  return record ? enrichNode(record.node) : null;
}

export async function updateNode(id, properties) {
  const query = `
    MATCH (node)
    WHERE id(node) = toInteger($id)
    SET node += $properties
    RETURN ${nodeSelection} AS node
  `;
  const [record] = await runQuery(query, { id, properties });
  return record ? enrichNode(record.node) : null;
}

export async function deleteNode(id) {
  const query = `
    MATCH (node)
    WHERE id(node) = toInteger($id)
    DETACH DELETE node
    RETURN toString($id) AS id
  `;
  const [record] = await runQuery(query, { id });
  return record?.id ?? null;
}

export async function expandNode(id, limit = 25) {
  const query = `
    MATCH (node)
    WHERE id(node) = toInteger($id)
    OPTIONAL MATCH (node)-[rel]-(neighbor)
    RETURN ${nodeSelection} AS node, collect(DISTINCT ${relationshipSelection}) AS relationships, collect(DISTINCT ${
      '{ id: toString(id(neighbor)), label: coalesce(neighbor.label, neighbor.name, toString(id(neighbor))), properties: properties(neighbor) }'
    }) AS neighbors
  `;
  const [record] = await runQuery(query, { id, limit });
  if (!record) {
    return null;
  }

  const node = enrichNode(record.node);
  const neighbors = record.neighbors
    .map((neighbor) => enrichNode(neighbor))
    .slice(0, limit);
  return { node, neighbors, relationships: record.relationships };
}

export async function traverseGraph(startId, depth = 2) {
  const query = `
    MATCH path = (start)-[*1..$depth]-(end)
    WHERE id(start) = toInteger($startId)
    RETURN nodes(path) AS pathNodes, relationships(path) AS pathRelationships
  `;
  const records = await runQuery(query, { startId, depth });
  const nodeMap = new Map();
  const linkMap = new Map();

  for (const record of records) {
    for (const node of record.pathNodes) {
      const enriched = enrichNode({
        id: node.elementId || node.id || String(node.identity),
        label: node.properties?.label || node.properties?.name || node.elementId || String(node.identity),
        properties: node.properties
      });
      nodeMap.set(enriched.id, enriched);
    }
    for (const rel of record.pathRelationships) {
      const id = rel.elementId || rel.id || String(rel.identity) || crypto.randomUUID();
      linkMap.set(id, {
        id,
        sourceId:
          rel.startNodeElementId || rel.startNodeId || rel.start || rel.startNodeElementId || String(rel.start),
        targetId:
          rel.endNodeElementId || rel.endNodeId || rel.end || rel.endNodeElementId || String(rel.end),
        type: rel.type,
        properties: rel.properties || {}
      });
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values())
  };
}

function enrichNode(node) {
  if (!node) {
    return null;
  }
  const position = node.position ?? generatePosition(node.id);
  return {
    id: String(node.id),
    label: node.label,
    properties: node.properties ?? {},
    position
  };
}

function generatePosition(id) {
  const seed = hashString(id);
  const angle = (seed % 360) * (Math.PI / 180);
  const radius = 10 + (seed % 5);
  const height = ((seed % 200) / 200) * 10 - 5;
  return {
    x: Math.cos(angle) * radius,
    y: height,
    z: Math.sin(angle) * radius
  };
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
