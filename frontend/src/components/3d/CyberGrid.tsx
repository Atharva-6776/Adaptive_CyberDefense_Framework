import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CyberGridProps {
  scrollProgress: number;
}

export function CyberGrid({ scrollProgress }: CyberGridProps) {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!gridRef.current) return;
    // Slow backward/forward movement along Z driven by delta and scroll
    gridRef.current.position.z = (state.clock.getElapsedTime() * 0.2 + scrollProgress * 5) % 2;
  });

  return (
    <group ref={gridRef} position={[0, -5, -5]} rotation={[-Math.PI / 2.2, 0, 0]}>
      <gridHelper
        args={[60, 40, "#00f0ff", "#0f2b48"]}
        position={[0, 0, 0]}
      />
    </group>
  );
}
