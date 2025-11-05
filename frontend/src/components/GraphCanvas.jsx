import PropTypes from 'prop-types';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';

const NODE_RADIUS = 0.6;
const NODE_COLOR = '#48a9fe';
const MANUAL_NODE_COLOR = '#6c5ce7';
const HOVER_COLOR = '#f6ad55';
const SELECTED_COLOR = '#ffe066';
const LINK_SOURCE_COLOR = '#10b981';
const LINK_COLOR = '#94a3b8';
const LINK_HIGHLIGHT_COLOR = '#fcd34d';

function GraphNode({
  node,
  isSelected,
  isLinkSource,
  isHovered,
  linkingActive,
  onClick,
  onDrag,
  onHover,
  onBlur
}) {
  const controls = useThree((state) => state.controls);
  const dragPlane = useRef(new THREE.Plane());
  const dragOffset = useRef(new THREE.Vector3());
  const dragIntersection = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  useCursor(isHovered || isSelected || isLinkSource || linkingActive);

  const position = useMemo(
    () => [node.position.x, node.position.y, node.position.z],
    [node.position.x, node.position.y, node.position.z]
  );

  const handlePointerDown = (event) => {
    event.stopPropagation();
    if (controls) {
      controls.enabled = false;
    }
    isDragging.current = true;
    hasMoved.current = false;
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -node.position.y);
    dragOffset.current
      .copy(event.point)
      .sub(new THREE.Vector3(node.position.x, node.position.y, node.position.z));
  };

  const handlePointerMove = (event) => {
    if (!isDragging.current) {
      return;
    }
    hasMoved.current = true;
    event.stopPropagation();
    if (event.ray.intersectPlane(dragPlane.current, dragIntersection.current)) {
      dragIntersection.current.sub(dragOffset.current);
      onDrag(node.id, {
        x: dragIntersection.current.x,
        y: node.position.y,
        z: dragIntersection.current.z
      });
    }
  };

  const handlePointerUp = (event) => {
    if (controls) {
      controls.enabled = true;
    }
    event.stopPropagation();
    isDragging.current = false;
  };

  const handlePointerOver = (event) => {
    event.stopPropagation();
    onHover(node.id);
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    onBlur(node.id);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (hasMoved.current) {
      return;
    }
    onClick(node.id);
  };

  const materialColor = (() => {
    if (isSelected) {
      return SELECTED_COLOR;
    }
    if (isLinkSource) {
      return LINK_SOURCE_COLOR;
    }
    if (isHovered) {
      return HOVER_COLOR;
    }
    if (node.isManual) {
      return MANUAL_NODE_COLOR;
    }
    return NODE_COLOR;
  })();

  return (
    <group position={position}>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
        <meshStandardMaterial color={materialColor} emissive={isSelected ? '#fbbf24' : '#111827'} emissiveIntensity={isSelected ? 0.4 : 0.1} />
      </mesh>
      <Text
        position={[0, NODE_RADIUS + 0.6, 0]}
        fontSize={0.4}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#0f172a"
      >
        {node.label}
      </Text>
    </group>
  );
}

GraphNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      z: PropTypes.number.isRequired
    }).isRequired,
    isManual: PropTypes.bool
  }).isRequired,
  isSelected: PropTypes.bool,
  isLinkSource: PropTypes.bool,
  isHovered: PropTypes.bool,
  linkingActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onDrag: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired
};

GraphNode.defaultProps = {
  isSelected: false,
  isLinkSource: false,
  isHovered: false,
  linkingActive: false
};

function GraphLink({ start, end, isHighlighted }) {
  const points = useMemo(() => new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]), [
    start.x,
    start.y,
    start.z,
    end.x,
    end.y,
    end.z
  ]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={points} count={2} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={isHighlighted ? LINK_HIGHLIGHT_COLOR : LINK_COLOR} linewidth={2} />
    </line>
  );
}

GraphLink.propTypes = {
  start: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    z: PropTypes.number.isRequired
  }).isRequired,
  end: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    z: PropTypes.number.isRequired
  }).isRequired,
  isHighlighted: PropTypes.bool
};

GraphLink.defaultProps = {
  isHighlighted: false
};

function GraphCanvas({
  nodes,
  links,
  selectedNodeId,
  hoveredNodeId,
  linkSourceId,
  linkingActive,
  onNodeClick,
  onNodeDrag,
  onNodeHover,
  onNodeBlur,
  onBackgroundClick
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const renderedLinks = useMemo(
    () =>
      links
        .map((link) => {
          const source = nodeMap.get(link.sourceId);
          const target = nodeMap.get(link.targetId);
          if (!source || !target) {
            return null;
          }
          const isHighlighted =
            link.sourceId === selectedNodeId ||
            link.targetId === selectedNodeId ||
            link.sourceId === linkSourceId ||
            link.targetId === linkSourceId;
          return { id: link.id, source, target, isHighlighted };
        })
        .filter(Boolean),
    [links, nodeMap, selectedNodeId, linkSourceId]
  );

  return (
    <group>
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(event) => {
          event.stopPropagation();
          onBackgroundClick();
        }}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <gridHelper args={[200, 40, '#1e293b', '#334155']} position={[0, -0.02, 0]} />
      {renderedLinks.map((link) => (
        <GraphLink key={link.id} start={link.source.position} end={link.target.position} isHighlighted={link.isHighlighted} />
      ))}
      {nodes.map((node) => (
        <GraphNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isLinkSource={linkSourceId === node.id}
          isHovered={hoveredNodeId === node.id}
          linkingActive={linkingActive}
          onClick={onNodeClick}
          onDrag={onNodeDrag}
          onHover={onNodeHover}
          onBlur={onNodeBlur}
        />
      ))}
    </group>
  );
}

GraphCanvas.propTypes = {
  nodes: PropTypes.arrayOf(GraphNode.propTypes.node).isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      sourceId: PropTypes.string.isRequired,
      targetId: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedNodeId: PropTypes.string,
  hoveredNodeId: PropTypes.string,
  linkSourceId: PropTypes.string,
  linkingActive: PropTypes.bool,
  onNodeClick: PropTypes.func.isRequired,
  onNodeDrag: PropTypes.func.isRequired,
  onNodeHover: PropTypes.func.isRequired,
  onNodeBlur: PropTypes.func.isRequired,
  onBackgroundClick: PropTypes.func.isRequired
};

GraphCanvas.defaultProps = {
  selectedNodeId: null,
  hoveredNodeId: null,
  linkSourceId: null,
  linkingActive: false
};

export default GraphCanvas;
