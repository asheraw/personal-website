"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Standalone preview of the same fix already shipped on the 2D character:
// the face is a real photo, so it can't be textured onto a rotating 3D
// head the way the rest of the body geometry is drawn -- there's no back
// or side of the photo to show. Instead the photo lives on a flat plane
// that's billboarded (always rotates to face the camera, independent of
// the body's own rotation), while the body spins normally underneath it.
// This file only exists to preview that idea before it replaces the
// drawn face on the real Character3D in World3D.tsx.
const HEAD_RADIUS = 0.22;

function CharacterBody() {
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Slow constant turntable -- lets you watch the face stay put while
    // the body spins, without needing to touch the orbit controls.
    if (bodyRef.current) bodyRef.current.rotation.y = t * 0.5;
    const phase = t * 3;
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(phase) * 0.3;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(phase) * 0.3;
  });

  return (
    <group ref={bodyRef}>
      {/* Torso -- shirt colour matches the real photo's shirt (same
          sample used on the 2D character) instead of the placeholder
          amber the live 3D model still wears. */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
        <meshStandardMaterial color="#3e3882" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.7, 0.22]}>
        <boxGeometry args={[0.14, 0.06, 0.04]} />
        <meshStandardMaterial color="#2c2760" roughness={0.4} />
      </mesh>
      {/* Head base -- plain skin sphere. No drawn hair cap or
          eyes/mouth anymore: the photo already has Asher's own cap baked
          into it, so a second procedural cap just showed through as a
          mismatched ring behind the photo. This sphere only needs to
          hold up the silhouette from the back and sides, where the
          billboard doesn't reach. */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[HEAD_RADIUS, 16, 16]} />
        <meshStandardMaterial color="#f3e9d4" roughness={0.4} />
      </mesh>
      <group position={[-0.3, 0.7, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshStandardMaterial color="#f3e9d4" roughness={0.4} />
        </mesh>
      </group>
      <group position={[0.3, 0.7, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshStandardMaterial color="#f3e9d4" roughness={0.4} />
        </mesh>
      </group>
      <mesh ref={leftLegRef} position={[-0.12, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.5} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.5} />
      </mesh>
    </group>
  );
}

function FaceBillboard() {
  const texture = useTexture("/asher/avatar-face.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <Billboard position={[0, 1.05, 0]}>
      {/* Pushed forward along the billboard's own facing axis (which
          Billboard keeps pointed at the camera) so it sits just proud of
          the head sphere's surface instead of clipping through its
          centre and getting hidden by the near half of the sphere. */}
      <mesh position={[0, 0, HEAD_RADIUS + 0.04]}>
        <planeGeometry args={[0.58, 0.58]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
      </mesh>
    </Billboard>
  );
}

export function Character3DFaceTest() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 15, 8]} intensity={1.0} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} color="#f0b865" />
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#f0b865" distance={15} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1410" roughness={0.85} />
      </mesh>
      <gridHelper args={[10, 10, "#4a3a28", "#2a2018"]} position={[0, 0.01, 0]} />
      <CharacterBody />
      <FaceBillboard />
    </>
  );
}
