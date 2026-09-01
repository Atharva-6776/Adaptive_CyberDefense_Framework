import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CyberGrid } from "./CyberGrid";
import { ParticleField } from "./ParticleField";
import { CyberShieldStructure } from "./CyberShieldStructure";
import { NetworkNodes } from "./NetworkNodes";

interface SceneContentProps {
  scrollProgress: number;
  securityState?: "normal" | "warning" | "critical" | "blocked";
}

export function SceneContent({
  scrollProgress,
  securityState = "normal",
}: SceneContentProps) {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionHandler);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", motionHandler);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useFrame(() => {
    // Target camera position based on scroll depth & mouse parallax
    const targetZ = 9 - scrollProgress * 5;
    const targetY = -scrollProgress * 1.5;
    const targetX = reducedMotion ? 0 : mouseRef.current.x * 0.8;
    const targetRotY = reducedMotion ? 0 : mouseRef.current.x * 0.05;
    const targetRotX = reducedMotion ? 0 : mouseRef.current.y * 0.05;

    // Smooth lerp camera movement
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + mouseRef.current.y * 0.4, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04);

    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotY, 0.04);
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX, 0.04);
  });

  return (
    <>
      {/* Ambient & Cyber Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} color="#00f0ff" />
      <pointLight position={[-10, -5, -5]} intensity={0.8} color="#3b82f6" />
      <pointLight position={[0, 0, -10]} intensity={1.2} color="#00f0ff" />

      {/* Cyber Environment Grid */}
      <CyberGrid scrollProgress={scrollProgress} />

      {/* Ambient Floating Particles */}
      <ParticleField scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* Interconnected Network Nodes */}
      <NetworkNodes
        scrollProgress={scrollProgress}
        isMobile={isMobile}
        securityState={securityState}
      />

      {/* Cyber Defense Shield Structure */}
      <CyberShieldStructure scrollProgress={scrollProgress} />
    </>
  );
}
