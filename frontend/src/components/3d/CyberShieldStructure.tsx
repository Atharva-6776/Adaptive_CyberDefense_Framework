import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CyberShieldProps {
  scrollProgress: number;
}

export function CyberShieldStructure({ scrollProgress }: CyberShieldProps) {
  const outerGroupRef = useRef<THREE.Group>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (outerGroupRef.current) {
      // Continuous slow rotation + scroll reaction
      outerGroupRef.current.rotation.y = time * 0.15 + scrollProgress * Math.PI;
      outerGroupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
      
      // Dynamic scale pulse
      const pulse = 1 + Math.sin(time * 1.5) * 0.03 + scrollProgress * 0.15;
      outerGroupRef.current.scale.set(pulse, pulse, pulse);
    }

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = -time * 0.25;
      innerMeshRef.current.rotation.z = time * 0.1;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.3;
      ring1Ref.current.rotation.y = time * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -time * 0.35;
      ring2Ref.current.rotation.z = time * 0.25;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -time * 0.2;
      ring3Ref.current.rotation.z = -time * 0.3;
    }
  });

  return (
    <group ref={outerGroupRef} position={[0, 0, -8]}>
      {/* Outer Icosahedron Shield Frame */}
      <mesh>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial
          color="#00f0ff"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Inner Core Dodecahedron */}
      <mesh ref={innerMeshRef}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshBasicMaterial
          color="#3b82f6"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Orbital Defense Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.2, 0.015, 16, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.6, 0.012, 16, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.5} />
      </mesh>

      <mesh ref={ring3Ref}>
        <torusGeometry args={[4.0, 0.01, 16, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
