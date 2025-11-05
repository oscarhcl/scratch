const manualNodes = new Map();
const manualLinks = new Map();

export function persistManualNode(node) {
  manualNodes.set(node.id, node);
  return node;
}

export function persistManualLink(link) {
  manualLinks.set(link.id, link);
  return link;
}

export function removeManualNode(nodeId) {
  manualNodes.delete(nodeId);
  for (const [id, link] of manualLinks.entries()) {
    if (link.sourceId === nodeId || link.targetId === nodeId) {
      manualLinks.delete(id);
    }
  }
}

export function getManualGraph() {
  return {
    nodes: Array.from(manualNodes.values()),
    links: Array.from(manualLinks.values())
  };
}

export function resetManualGraph() {
  manualNodes.clear();
  manualLinks.clear();
}
