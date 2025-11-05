import PropTypes from 'prop-types';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const NODE_RADIUS = 0.6;
const NODE_COLOR = '#48a9fe';
const HOVER_COLOR = '#f6ad55';

function Node({ node, onHover, onBlur, onClick }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      <mesh
        ref={meshRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(node.id);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onBlur(node.id);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick(node.id);
        }}
      >
        <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
        <meshStandardMaterial color={node.isHovered ? HOVER_COLOR : NODE_COLOR} />
      </mesh>
      <Text position={[0, NODE_RADIUS + 0.5, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        {node.label}
      </Text>
    </group>
  );
}

Node.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      z: PropTypes.number.isRequired
    }).isRequired,
    isHovered: PropTypes.bool
  }).isRequired,
  onHover: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired
};

function Link({ link }) {
  const start = link.source.position;
  const end = link.target.position;

  const points = useMemo(() => {
    return [start.x, start.y, start.z, end.x, end.y, end.z];
  }, [start, end]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(points)}
          count={points.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#a0aec0" linewidth={2} />
    </line>
  );
}

Link.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    source: PropTypes.object.isRequired,
    target: PropTypes.object.isRequired
  }).isRequired
};

function GraphCanvas({ nodes, links, onExpandNode }) {
  const handleHover = (nodeId) => {
    onExpandNode(nodeId, { previewOnly: true });
  };

  const handleBlur = () => {};

  const handleClick = (nodeId) => {
    onExpandNode(nodeId);
  };

  return (
    <group>
      {links.map((link) => (
        <Link key={link.id} link={link} />
      ))}
      {nodes.map((node) => (
        <Node key={node.id} node={node} onHover={handleHover} onBlur={handleBlur} onClick={handleClick} />
      ))}
    </group>
  );
}

GraphCanvas.propTypes = {
  nodes: PropTypes.arrayOf(Node.propTypes.node).isRequired,
  links: PropTypes.arrayOf(Link.propTypes.link).isRequired,
  onExpandNode: PropTypes.func.isRequired
};

export default GraphCanvas;
