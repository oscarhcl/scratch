import { useCallback, useEffect, useMemo, useState } from 'react';

const defaultNodes = [
  {
    id: 'placeholder-1',
    label: 'Loading...',
    position: { x: 0, y: 0, z: 0 }
  }
];

const defaultLinks = [];

const jitter = () => (Math.random() - 0.5) * 10;

const normalizeNode = (node) => ({
  ...node,
  position: node.position ?? { x: jitter(), y: jitter(), z: jitter() }
});

const normalizeLink = (link, nodeMap) => {
  const source = nodeMap.get(link.sourceId);
  const target = nodeMap.get(link.targetId);
  if (!source || !target) {
    return null;
  }
  return {
    id: link.id,
    source,
    target
  };
};

export default function useGraphData(api) {
  const [nodes, setNodes] = useState(defaultNodes);
  const [links, setLinks] = useState(defaultLinks);

  const fetchGraph = useCallback(async () => {
    try {
      const response = await api.get('/graph');
      const nodeMap = new Map();
      const normalizedNodes = response.data.nodes.map((node) => {
        const normalized = normalizeNode(node);
        nodeMap.set(normalized.id, normalized);
        return normalized;
      });
      const normalizedLinks = response.data.links
        .map((link) => normalizeLink(link, nodeMap))
        .filter(Boolean);

      setNodes(normalizedNodes);
      setLinks(normalizedLinks);
    } catch (error) {
      console.error('Failed to fetch graph', error);
    }
  }, [api]);

  const expandNode = useCallback(
    async (nodeId, options = {}) => {
      try {
        const response = await api.post(`/nodes/${nodeId}/expand`, { previewOnly: options.previewOnly });
        if (!options.previewOnly) {
          await fetchGraph();
        }
        return response.data;
      } catch (error) {
        console.error('Failed to expand node', error);
        return null;
      }
    },
    [api, fetchGraph]
  );

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return useMemo(
    () => ({
      nodes,
      links,
      refresh: fetchGraph,
      expandNode
    }),
    [nodes, links, fetchGraph, expandNode]
  );
}
