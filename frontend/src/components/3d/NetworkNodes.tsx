import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NetworkNodesProps {
  scrollProgress: number;
  isMobile?: boolean;
  securityState?: "normal" | "warning" | "critical" | "blocked";
}

interface NodeData {
  position: THREE.Vector3;
  type: "normal" | "threat" | "defense" | "core";
}

export function NetworkNodes({
  scrollProgress,
  isMobile = false,
  securityState = "normal",
}: NetworkNodesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const count = isMobile ? 18 : 36;
  const maxDistance = isMobile ? 6 : 8;

  // Generate node positions and attributes
  const { nodes, linePositions, packetPaths } = useMemo(() => {
    const nodeArray: NodeData[] = [];
    const positions: number[] = [];
    const paths: { start: THREE.Vector3; end: THREE.Vector3; speed: number; progress: number }[] = [];

    // Seeded pseudo-random generation for deterministic node positions
    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 8;
      const theta = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;

      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi) + (Math.random() - 0.5) * 4;
      const z = radius * Math.sin(theta) * Math.cos(phi) - 4;

      let type: NodeData["type"] = "normal";
      if (i % 7 === 0) type = "threat";
      else if (i % 5 === 0) type = "defense";
      else if (i % 11 === 0) type = "core";

      nodeArray.push({ position: new THREE.Vector3(x, y, z), type });
    }

    // Connect nodes with lines if distance < maxDistance
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = nodeArray[i].position.distanceTo(nodeArray[j].position);
        if (dist < maxDistance) {
          positions.push(
            nodeArray[i].position.x,
            nodeArray[i].position.y,
            nodeArray[i].position.z,
            nodeArray[j].position.x,
            nodeArray[j].position.y,
            nodeArray[j].position.z
          );

          // Data packet path along connection
          paths.push({
            start: nodeArray[i].position,
            end: nodeArray[j].position,
            speed: 0.2 + Math.random() * 0.4,
            progress: Math.random(),
          });
        }
      }
    }

    return {
      nodes: nodeArray,
      linePositions: new Float32Array(positions),
      packetPaths: paths,
    };
  }, [count, maxDistance]);

  const packetCount = packetPaths.length;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Speed up or enhance pulse based on securityState
    const speedMultiplier = securityState === "critical" ? 2.5 : securityState === "warning" ? 1.6 : 1.0;

    // Slow ambient rotation of network
    groupRef.current.rotation.y = time * 0.05 * speedMultiplier + scrollProgress * 0.8;
    groupRef.current.rotation.x = Math.sin(time * 0.03) * 0.05;

    // Animate traveling data packets
    if (packetsRef.current) {
      packetPaths.forEach((path, i) => {
        // Active packet animation unless blocked state hides threat packets
        path.progress = (path.progress + delta * path.speed * speedMultiplier) % 1;

        const currentPos = new THREE.Vector3().lerpVectors(path.start, path.end, path.progress);
        dummy.position.copy(currentPos);
        dummy.scale.setScalar(0.08 + Math.sin(time * 4 + i) * 0.02);
        dummy.updateMatrix();
        packetsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      packetsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Node Spheres */}
      {nodes.map((node, i) => {
        let color = "#00f0ff";
        if (node.type === "threat") {
          color = securityState === "blocked" ? "#64748b" : "#ef4444";
        } else if (node.type === "defense") {
          color = "#10b981";
        } else if (node.type === "core") {
          color = "#3b82f6";
        }

        return (
          <mesh key={i} position={node.position}>
            <sphereGeometry args={[node.type === "core" ? 0.18 : 0.12, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} />
          </mesh>
        );
      })}

      {/* Network Connection Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#0284c7"
          transparent
          opacity={securityState === "critical" ? 0.45 : 0.25}
          linewidth={1}
        />
      </lineSegments>

      {/* Glowing Data Packets moving on connection lines */}
      <instancedMesh
        ref={packetsRef}
        args={[undefined, undefined, packetCount]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={securityState === "critical" ? "#f59e0b" : "#00f0ff"}
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  );
}
