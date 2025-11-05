import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import GraphCanvas from './components/GraphCanvas.jsx';
import useGraphData from './hooks/useGraphData.js';
import { createApiClient } from './services/api.js';

const api = createApiClient();

function App() {
  const { nodes, links, refresh, expandNode } = useGraphData(api);

  const cameraPosition = useMemo(() => [0, 0, 30], []);

  return (
    <div className="app">
      <header>
        <h1>Graph Explorer</h1>
        <button type="button" onClick={refresh}>
          Refresh graph
        </button>
      </header>
      <main>
        <div className="canvas-wrapper">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={cameraPosition} />
              <OrbitControls enablePan enableRotate enableZoom />
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <GraphCanvas nodes={nodes} links={links} onExpandNode={expandNode} />
            </Suspense>
          </Canvas>
        </div>
      </main>
    </div>
  );
}

export default App;
