import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, PerspectiveCamera } from '@react-three/drei';
import { shallow } from 'zustand/shallow';
import GraphCanvas from './components/GraphCanvas.jsx';
import { createApiClient } from './services/api.js';
import useGraphStore from './state/graphStore.js';

const api = createApiClient();

const graphSelector = (state) => ({
  nodes: state.nodes,
  links: state.links,
  selectedNodeId: state.selectedNodeId,
  hoveredNodeId: state.hoveredNodeId,
  linkMode: state.linkMode,
  linkSourceId: state.linkSourceId,
  isLoading: state.isLoading,
  setApiClient: state.setApiClient,
  loadGraph: state.loadGraph,
  refreshGraph: state.refreshGraph,
  addManualNode: state.addManualNode,
  createManualLink: state.createManualLink,
  updateNodePosition: state.updateNodePosition,
  selectNode: state.selectNode,
  clearSelection: state.clearSelection,
  setHoveredNode: state.setHoveredNode,
  clearHoveredNode: state.clearHoveredNode,
  setLinkMode: state.setLinkMode,
  setLinkSource: state.setLinkSource,
  clearLinkSource: state.clearLinkSource
});

function App() {
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const {
    nodes,
    links,
    selectedNodeId,
    hoveredNodeId,
    linkMode,
    linkSourceId,
    isLoading,
    setApiClient,
    loadGraph,
    refreshGraph,
    addManualNode,
    createManualLink,
    updateNodePosition,
    selectNode,
    clearSelection,
    setHoveredNode,
    clearHoveredNode,
    setLinkMode,
    setLinkSource,
    clearLinkSource
  } = useGraphStore(graphSelector, shallow);

  useEffect(() => {
    setApiClient(api);
  }, [setApiClient]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const cameraPosition = useMemo(() => [0, 0, 30], []);

  const handleRefresh = () => {
    refreshGraph();
  };

  const handleAddNode = async () => {
    const label = newNodeLabel.trim() || undefined;
    const created = await addManualNode({ label });
    if (created) {
      selectNode(created.id);
      setNewNodeLabel('');
    }
  };

  const handleToggleLinkMode = () => {
    if (linkMode) {
      setLinkMode(false);
      clearLinkSource();
      return;
    }
    setLinkMode(true);
    if (selectedNodeId) {
      setLinkSource(selectedNodeId);
    }
  };

  const handleCancelLinking = () => {
    setLinkMode(false);
    clearLinkSource();
  };

  const handleNodeClick = (nodeId) => {
    if (linkMode) {
      if (!linkSourceId) {
        setLinkSource(nodeId);
        selectNode(nodeId);
        return;
      }
      if (linkSourceId === nodeId) {
        clearLinkSource();
        selectNode(nodeId);
        return;
      }
      createManualLink(linkSourceId, nodeId);
      setLinkSource(nodeId);
      selectNode(nodeId);
      return;
    }

    if (selectedNodeId === nodeId) {
      clearSelection();
    } else {
      selectNode(nodeId);
    }
  };

  const handleBackgroundClick = () => {
    clearSelection();
    if (linkMode) {
      clearLinkSource();
    }
  };

  const linkingHint = () => {
    if (!linkMode) {
      return null;
    }
    if (!linkSourceId) {
      return 'Select a node to start linking.';
    }
    const activeNode = nodes.find((node) => node.id === linkSourceId);
    return activeNode ? `Select another node to connect with "${activeNode.label}".` : 'Select another node to connect.';
  };

  return (
    <div className="app">
      <header>
        <h1>Graph Explorer</h1>
        <button type="button" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Refreshing…' : 'Refresh graph'}
        </button>
      </header>
      <main>
        <div className="sidebar">
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="toolbar-label" htmlFor="new-node-label">
                Node label
              </label>
              <input
                id="new-node-label"
                type="text"
                className="toolbar-input"
                placeholder="e.g. New Idea"
                value={newNodeLabel}
                onChange={(event) => setNewNodeLabel(event.target.value)}
              />
              <button type="button" className="toolbar-button" onClick={handleAddNode}>
                Add node
              </button>
            </div>
            <div className="toolbar-group">
              <button
                type="button"
                className={`toolbar-button ${linkMode ? 'toolbar-button--active' : ''}`}
                onClick={handleToggleLinkMode}
              >
                {linkMode ? 'Finish linking' : 'Link nodes'}
              </button>
              {linkMode && (
                <button type="button" className="toolbar-button" onClick={handleCancelLinking}>
                  Cancel
                </button>
              )}
            </div>
            {linkMode && <p className="toolbar-hint">{linkingHint()}</p>}
          </div>
        </div>
        <div className="canvas-wrapper">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={cameraPosition} />
              <MapControls enableRotate enablePan enableZoom zoomSpeed={0.8} panSpeed={0.8} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[12, 18, 8]} intensity={1.1} castShadow />
              <GraphCanvas
                nodes={nodes}
                links={links}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
                linkSourceId={linkSourceId}
                linkingActive={linkMode}
                onNodeClick={handleNodeClick}
                onNodeDrag={updateNodePosition}
                onNodeHover={setHoveredNode}
                onNodeBlur={clearHoveredNode}
                onBackgroundClick={handleBackgroundClick}
              />
            </Suspense>
          </Canvas>
        </div>
      </main>
    </div>
  );
}

export default App;
