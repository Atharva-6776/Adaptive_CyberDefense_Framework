import { useState, useEffect, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneContent } from "./SceneContent";

interface CyberDefenseBackgroundProps {
  scrollProgress?: number;
  children?: ReactNode;
}

export function CyberDefenseBackground({
  scrollProgress = 0,
}: CyberDefenseBackgroundProps) {
  const [isActive, setIsActive] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const hasWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      setWebglSupported(hasWebGL);
    } catch {
      setWebglSupported(false);
    }

    // Tab visibility handling to pause rendering when backgrounded
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-90" />
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 60, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        frameloop={isActive ? "always" : "never"}
        style={{ pointerEvents: "none" }}
      >
        <SceneContent scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
export default CyberDefenseBackground;
