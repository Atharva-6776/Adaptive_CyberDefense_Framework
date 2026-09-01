import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  scrollProgress: number;
  isMobile?: boolean;
}

export function ParticleField({ scrollProgress, isMobile = false }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = isMobile ? 300 : 700;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color("#00f0ff");
    const blue = new THREE.Color("#3b82f6");
    const purple = new THREE.Color("#8b5cf6");
    const amber = new THREE.Color("#f59e0b");

    const colorPalette = [cyan, cyan, blue, purple, amber];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;

      const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.02 + scrollProgress * 0.5;
    pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.05 + scrollProgress * 0.2;
    pointsRef.current.position.z = Math.sin(time * 0.1) * 0.5;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.06 : 0.08}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
