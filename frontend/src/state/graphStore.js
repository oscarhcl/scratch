import { create } from 'zustand';
import {
  getManualGraph,
  persistManualLink,
  persistManualNode,
  resetManualGraph
} from '../services/manualGraphStore.js';

const randomInRange = (range) => (Math.random() - 0.5) * range * 2;

const defaultPosition = () => ({
  x: randomInRange(8),
  y: randomInRange(2),
  z: randomInRange(8)
});

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);

const normalizeNode = (node, overrides = {}) => ({
  id: String(node.id ?? generateId()),
  label: node.label ?? 'Untitled node',
  position: node.position ?? defaultPosition(),
  properties: node.properties ?? {},
  isManual: Boolean(node.isManual),
  ...overrides
});

const normalizeLink = (link, overrides = {}) => ({
  id: String(link.id ?? generateId()),
  sourceId: String(link.sourceId ?? link.source?.id),
  targetId: String(link.targetId ?? link.target?.id),
  type: link.type ?? 'RELATED_TO',
  isManual: Boolean(link.isManual),
  ...overrides
});

const mergeGraph = (graphNodes, manualNodes, graphLinks, manualLinks) => {
  const nodeMap = new Map();
  graphNodes.forEach((node) => nodeMap.set(node.id, node));
  manualNodes.forEach((node) => nodeMap.set(node.id, node));

  const nodes = Array.from(nodeMap.values());
  const nodeIds = new Set(nodeMap.keys());

  const links = [...graphLinks, ...manualLinks].filter(
    (link) => nodeIds.has(link.sourceId) && nodeIds.has(link.targetId)
  );

  return { nodes, links };
};

const manualGraph = getManualGraph();

export const useGraphStore = create((set, get) => ({
  apiClient: null,
  graphNodes: [],
  graphLinks: [],
  manualNodes: manualGraph.nodes,
  manualLinks: manualGraph.links,
  nodes: [],
  links: [],
  isLoading: false,
  error: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  linkMode: false,
  linkSourceId: null,

  setApiClient: (apiClient) => set({ apiClient }),

  loadGraph: async () => {
    const { apiClient } = get();
    if (!apiClient) {
      const { nodes, links } = mergeGraph([], get().manualNodes, [], get().manualLinks);
      set({ nodes, links });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/graph');
      const graphNodes = response.data.nodes.map((node) => normalizeNode(node));
      const graphLinks = response.data.links.map((link) => normalizeLink(link));
      const { nodes, links } = mergeGraph(graphNodes, get().manualNodes, graphLinks, get().manualLinks);
      set({ graphNodes, graphLinks, nodes, links, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch graph data', error);
      const { nodes, links } = mergeGraph([], get().manualNodes, [], get().manualLinks);
      set({
        isLoading: false,
        error: error?.message ?? 'Failed to load graph',
        nodes,
        links
      });
    }
  },

  refreshGraph: async () => {
    await get().loadGraph();
  },

  expandNode: async (nodeId, options = {}) => {
    const { apiClient } = get();
    if (!apiClient) {
      return null;
    }

    try {
      const response = await apiClient.post(`/nodes/${nodeId}/expand`, {
        previewOnly: Boolean(options.previewOnly)
      });

      if (!options.previewOnly) {
        await get().loadGraph();
      }

      return response.data;
    } catch (error) {
      console.error('Failed to expand node', error);
      return null;
    }
  },

  addManualNode: async ({ label, position }) => {
    const baseNode = normalizeNode(
      {
        id: `manual-${generateId()}`,
        label,
        position,
        isManual: true
      },
      { isManual: true }
    );

    const { apiClient } = get();
    if (apiClient) {
      try {
        const response = await apiClient.post('/nodes', {
          label: baseNode.label,
          properties: { ...baseNode.properties, isManual: true }
        });
        const persisted = normalizeNode(response.data, {
          position: baseNode.position,
          isManual: true
        });
        persistManualNode(persisted);
        set((state) => {
          const manualNodes = [...state.manualNodes.filter((node) => node.id !== persisted.id), persisted];
          const { nodes, links } = mergeGraph(state.graphNodes, manualNodes, state.graphLinks, state.manualLinks);
          return { manualNodes, nodes, links };
        });
        return persisted;
      } catch (error) {
        console.warn('Persisting node via API failed, using in-memory store instead', error);
      }
    }

    persistManualNode(baseNode);
    set((state) => {
      const manualNodes = [...state.manualNodes, baseNode];
      const { nodes, links } = mergeGraph(state.graphNodes, manualNodes, state.graphLinks, state.manualLinks);
      return { manualNodes, nodes, links };
    });
    return baseNode;
  },

  createManualLink: (sourceId, targetId) => {
    const manualLink = normalizeLink(
      {
        id: `manual-link-${generateId()}`,
        sourceId,
        targetId,
        isManual: true
      },
      { isManual: true }
    );

    persistManualLink(manualLink);

    set((state) => {
      const manualLinks = [...state.manualLinks, manualLink];
      const { nodes, links } = mergeGraph(state.graphNodes, state.manualNodes, state.graphLinks, manualLinks);
      return { manualLinks, nodes, links };
    });

    return manualLink;
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => {
      const updateNodes = (nodes) =>
        nodes.map((node) => (node.id === nodeId ? { ...node, position } : node));

      const graphNodes = updateNodes(state.graphNodes);
      const manualNodes = updateNodes(state.manualNodes);
      const { nodes, links } = mergeGraph(graphNodes, manualNodes, state.graphLinks, state.manualLinks);
      return { graphNodes, manualNodes, nodes, links };
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  clearSelection: () => set({ selectedNodeId: null }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  clearHoveredNode: () => set({ hoveredNodeId: null }),

  setLinkMode: (enabled) =>
    set((state) => ({
      linkMode: enabled,
      linkSourceId: enabled ? state.linkSourceId : null
    })),

  setLinkSource: (nodeId) => set({ linkSourceId: nodeId }),
  clearLinkSource: () => set({ linkSourceId: null }),

  resetManualGraph: () => {
    resetManualGraph();
    set((state) => {
      const manualNodes = [];
      const manualLinks = [];
      const { nodes, links } = mergeGraph(state.graphNodes, manualNodes, state.graphLinks, manualLinks);
      return { manualNodes, manualLinks, nodes, links };
    });
  }
}));

export default useGraphStore;
