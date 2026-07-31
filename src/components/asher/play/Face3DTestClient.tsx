"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Character3DFaceTest } from "@/components/asher/play/Character3DFaceTest";

export function Face3DTestClient() {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-faint bg-black/40" style={{ aspectRatio: "4 / 3" }}>
      <Canvas shadows camera={{ position: [0, 1.5, 2.3], fov: 42 }}>
        <color attach="background" args={["#1a1410"]} />
        <Suspense fallback={null}>
          <Character3DFaceTest />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.2} maxDistance={5} target={[0, 0.75, 0]} />
      </Canvas>
    </div>
  );
}
