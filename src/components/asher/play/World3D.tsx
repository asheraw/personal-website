"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   World3D — Full 3D interactive world for Play Mode
   - 8 distinct 3D structures (one per zone)
   - 3D character that walks between them
   - Click-to-move + keyboard controls
   - Camera follows character
   ============================================================ */

export type Zone3D = {
  id: string;
  label: string;
  position: [number, number, number]; // x, z on ground plane (y=0)
  color: string;
  accentColor: string;
  activity: string;
};

const ZONES_3D: Zone3D[] = [
  { id: "stage",      label: "The Stage",    position: [-6, 0, -4], color: "#3d2a14", accentColor: "#f0b865", activity: "Holding a microphone" },
  { id: "coaching",   label: "The Studio",   position: [0, 0, -4],  color: "#2d2417", accentColor: "#d99846", activity: "Singing with musical notes" },
  { id: "faith",      label: "The Heart",    position: [6, 0, -4],  color: "#2a1f15", accentColor: "#c44d3f", activity: "Reading the Bible" },
  { id: "glance",     label: "At a Glance",  position: [-6, 0, 0],  color: "#241c14", accentColor: "#b8924a", activity: "Examining with a magnifying glass" },
  { id: "hero",       label: "Welcome",      position: [0, 0, 0],   color: "#3d2a14", accentColor: "#f0b865", activity: "Welcoming you" },
  { id: "callings",   label: "Two Callings", position: [6, 0, 0],   color: "#2d2417", accentColor: "#d99846", activity: "Holding the masks" },
  { id: "philosophy", label: "Philosophy",   position: [-6, 0, 4],  color: "#2a1f15", accentColor: "#c44d3f", activity: "Studying with books" },
  { id: "contact",    label: "Contact",      position: [0, 0, 4],   color: "#241c14", accentColor: "#b8924a", activity: "Talking on the phone" },
];

const ZONE_LABELS_3D: Record<string, { activity: string; label: string }> = Object.fromEntries(
  ZONES_3D.map(z => [z.id, { activity: z.activity, label: z.label }])
);

/* ---------- Ground plane ---------- */
function Ground({ activeZone }: { activeZone: string | null }) {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0807" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Zone tiles */}
      {ZONES_3D.map((zone) => {
        const isActive = zone.id === activeZone;
        return (
          <mesh
            key={zone.id}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[zone.position[0], 0.01, zone.position[2]]}
            onClick={(e) => { e.stopPropagation(); onZoneClick(zone.id); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "default"; }}
          >
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial
              color={isActive ? zone.accentColor : "#14100c"}
              transparent
              opacity={isActive ? 0.4 : 0.6}
              emissive={isActive ? zone.accentColor : "#000000"}
              emissiveIntensity={isActive ? 0.3 : 0}
            />
          </mesh>
        );
      })}
      {/* Grid lines */}
      <gridHelper args={[40, 40, "#3d2a14", "#1a1208"]} position={[0, 0.02, 0]} />
    </group>
  );
}

/* ---------- Click handler (module-level, set by component) ---------- */
let onZoneClick = (_id: string) => {};

/* ---------- Zone Structures ---------- */

// Theatre Stage — raised platform with curtains and spotlight
function TheatreStage({ active }: { active: boolean }) {
  return (
    <group>
      {/* Stage platform */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.5, 3]} />
        <meshStandardMaterial color="#3d2a14" roughness={0.8} />
      </mesh>
      {/* Curtains (left and right) */}
      <mesh position={[-1.2, 1.5, -1.4]} castShadow>
        <boxGeometry args={[0.6, 2.5, 0.1]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.7} />
      </mesh>
      <mesh position={[1.2, 1.5, -1.4]} castShadow>
        <boxGeometry args={[0.6, 2.5, 0.1]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.7} />
      </mesh>
      {/* Curtain top */}
      <mesh position={[0, 2.8, -1.4]} castShadow>
        <boxGeometry args={[3, 0.4, 0.1]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.7} />
      </mesh>
      {/* Spotlight beam (glowing cylinder) */}
      {active && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.05, 1.5, 3, 16, 1, true]} />
          <meshBasicMaterial color="#f0b865" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Spotlight fixture */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#1a1208" metalness={0.8} roughness={0.3} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.5 : 0} />
      </mesh>
    </group>
  );
}

// Studio — podium with microphone
function Studio({ active }: { active: boolean }) {
  return (
    <group>
      {/* Podium */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1, 1, 16]} />
        <meshStandardMaterial color="#2d2417" roughness={0.6} />
      </mesh>
      {/* Mic stand */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#1a1208" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Mic head */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#1a1208" metalness={0.7} roughness={0.3} emissive={active ? "#d99846" : "#000000"} emissiveIntensity={active ? 0.4 : 0} />
      </mesh>
      {/* Music notes floating */}
      {active && [0, 1, 2].map(i => (
        <mesh key={i} position={[Math.sin(i * 2) * 1.2, 2.5 + i * 0.3, Math.cos(i * 2) * 0.8]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#f0b865" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Cathedral — arched structure with cross
function Cathedral({ active }: { active: boolean }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1, 2.5]} />
        <meshStandardMaterial color="#2a1f15" roughness={0.8} />
      </mesh>
      {/* Arched roof (half cylinder) */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 2.5, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Spire */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.3, 1, 8]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.6} />
      </mesh>
      {/* Cross */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#f0b865" metalness={0.6} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.5 : 0} />
      </mesh>
      <mesh position={[0, 3.45, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.08]} />
        <meshStandardMaterial color="#f0b865" metalness={0.6} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.5 : 0} />
      </mesh>
      {/* Stained glass window glow */}
      {active && (
        <mesh position={[0, 1.2, 1.26]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshBasicMaterial color="#f0b865" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Magnifying Glass zone — giant magnifying glass
function MagnifierZone({ active }: { active: boolean }) {
  return (
    <group>
      {/* Base ring */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial color="#241c14" roughness={0.7} />
      </mesh>
      {/* Handle */}
      <mesh position={[1.2, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.5, 8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.5} />
      </mesh>
      {/* Glass ring */}
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.8, 0.08, 8, 32]} />
        <meshStandardMaterial color="#b8924a" metalness={0.7} roughness={0.3} emissive={active ? "#b8924a" : "#000000"} emissiveIntensity={active ? 0.4 : 0} />
      </mesh>
      {/* Glass lens */}
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 32]} />
        <meshPhysicalMaterial color="#f0b865" transparent opacity={0.25} roughness={0.1} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Welcome Plaza — fountain with star
function WelcomePlaza({ active }: { active: boolean }) {
  return (
    <group>
      {/* Fountain base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.6, 16]} />
        <meshStandardMaterial color="#3d2a14" roughness={0.7} />
      </mesh>
      {/* Water (inner) */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[1, 1, 0.1, 16]} />
        <meshPhysicalMaterial color="#f0b865" transparent opacity={0.4} roughness={0.1} />
      </mesh>
      {/* Center pillar */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
        <meshStandardMaterial color="#2d2417" roughness={0.6} />
      </mesh>
      {/* Star on top */}
      <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 5]} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#f0b865" metalness={0.8} roughness={0.2} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.6 : 0.2} />
      </mesh>
    </group>
  );
}

// Drama Masks — two mask statues
function DramaMasks({ active }: { active: boolean }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.4, 1.5]} />
        <meshStandardMaterial color="#2d2417" roughness={0.7} />
      </mesh>
      {/* Comedy mask (left) */}
      <mesh position={[-0.8, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#f3e9d4" roughness={0.5} emissive={active ? "#f3e9d4" : "#000000"} emissiveIntensity={active ? 0.2 : 0} />
      </mesh>
      {/* Comedy mask smile */}
      <mesh position={[-0.8, 1, 0.45]}>
        <torusGeometry args={[0.2, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1208" />
      </mesh>
      {/* Tragedy mask (right) */}
      <mesh position={[0.8, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#d99846" roughness={0.5} emissive={active ? "#d99846" : "#000000"} emissiveIntensity={active ? 0.2 : 0} />
      </mesh>
      {/* Tragedy mask frown */}
      <mesh position={[0.8, 1.35, 0.45]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.2, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1208" />
      </mesh>
    </group>
  );
}

// Library — bookshelf with books
function Library({ active }: { active: boolean }) {
  return (
    <group>
      {/* Bookshelf frame */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2, 0.8]} />
        <meshStandardMaterial color="#2a1f15" roughness={0.8} />
      </mesh>
      {/* Shelf divisions */}
      {[-0.5, 0, 0.5].map(y => (
        <mesh key={y} position={[0, 1 + y, 0.1]}>
          <boxGeometry args={[2.4, 0.05, 0.6]} />
          <meshStandardMaterial color="#1a1208" />
        </mesh>
      ))}
      {/* Books */}
      {[-0.7, -0.2, 0.3, 0.8].map((y, i) =>
        [-0.9, -0.5, -0.1, 0.3, 0.7].map((x, j) => (
          <mesh key={`${i}-${j}`} position={[x, 1 + y + 0.2, 0.25]} castShadow>
            <boxGeometry args={[0.15, 0.4, 0.3]} />
            <meshStandardMaterial color={["#c44d3f", "#d99846", "#f0b865", "#8b5a2b", "#b8924a"][(i + j) % 5]} roughness={0.6} />
          </mesh>
        ))
      )}
      {/* Desk */}
      <mesh position={[0, 0.4, 1.5]} castShadow>
        <boxGeometry args={[2, 0.1, 0.8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.5} />
      </mesh>
      {/* Desk legs */}
      {[-0.9, 0.9].map(x => [-0.3, 0.3].map(z => (
        <mesh key={`${x}-${z}`} position={[x, 0.2, 1.5 + z]}>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>
      )))}
      {/* Reading lamp */}
      <mesh position={[0.6, 0.6, 1.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#1a1208" metalness={0.7} />
      </mesh>
      <mesh position={[0.6, 0.85, 1.5]}>
        <coneGeometry args={[0.15, 0.2, 8]} />
        <meshStandardMaterial color="#f0b865" emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.6 : 0} />
      </mesh>
    </group>
  );
}

// Phone Booth — classic red phone booth
function PhoneBooth({ active }: { active: boolean }) {
  return (
    <group>
      {/* Booth body */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.4, 1.2]} />
        <meshStandardMaterial color="#241c14" roughness={0.6} />
      </mesh>
      {/* Red frame */}
      <mesh position={[0, 1.2, 0.01]}>
        <boxGeometry args={[1.25, 2.45, 0.05]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.5} emissive={active ? "#c44d3f" : "#000000"} emissiveIntensity={active ? 0.3 : 0} />
      </mesh>
      {/* Windows (grid pattern) */}
      {[-0.3, 0.3].map(x => [0.5, 1, 1.5, 2].map(y => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.62]}>
          <boxGeometry args={[0.4, 0.35, 0.02]} />
          <meshPhysicalMaterial color="#f0b865" transparent opacity={0.3} roughness={0.1} metalness={0.3} />
        </mesh>
      )))}
      {/* Roof */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[1.3, 0.15, 1.3]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.5} />
      </mesh>
      {/* Sign on top */}
      <mesh position={[0, 2.65, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.05]} />
        <meshStandardMaterial color="#f0b865" emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.7 : 0.2} />
      </mesh>
    </group>
  );
}

/* ---------- Zone wrapper with label billboard ---------- */
function ZoneStructure({ zone, active }: { zone: Zone3D; active: boolean }) {
  const labelRef = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (labelRef.current) {
      labelRef.current.lookAt(camera.position.x, labelRef.current.position.y, camera.position.z);
    }
  });

  return (
    <group position={zone.position}>
      {/* Structure */}
      {zone.id === "stage" && <TheatreStage active={active} />}
      {zone.id === "coaching" && <Studio active={active} />}
      {zone.id === "faith" && <Cathedral active={active} />}
      {zone.id === "glance" && <MagnifierZone active={active} />}
      {zone.id === "hero" && <WelcomePlaza active={active} />}
      {zone.id === "callings" && <DramaMasks active={active} />}
      {zone.id === "philosophy" && <Library active={active} />}
      {zone.id === "contact" && <PhoneBooth active={active} />}

      {/* Floating label billboard */}
      <group ref={labelRef} position={[0, 4, 0]}>
        <mesh>
          <planeGeometry args={[3, 0.5]} />
          <meshBasicMaterial color={active ? zone.accentColor : "#14100c"} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- 3D Character ---------- */
function Character3D({
  position,
  activity,
  isMoving,
}: {
  position: [number, number, number];
  activity: string;
  isMoving: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Bob up and down
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
    }
    // Walking animation
    if (isMoving) {
      const phase = t * 8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(phase) * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(phase) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.sin(phase) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(phase) * 0.4;
    } else {
      // Activity-specific poses
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (activity === "mic" || activity === "phone") {
        // Right arm raised
        if (rightArmRef.current) rightArmRef.current.rotation.x = -1.5;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0.3;
      } else if (activity === "singing" || activity === "welcome") {
        // Both arms out
        if (leftArmRef.current) leftArmRef.current.rotation.z = 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -0.8;
      } else if (activity === "reading" || activity === "magnifying") {
        // Arms forward
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.8;
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.z = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body (capsule) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
        <meshStandardMaterial color="#d99846" roughness={0.6} />
      </mesh>
      {/* Bowtie */}
      <mesh position={[0, 0.7, 0.22]}>
        <boxGeometry args={[0.12, 0.06, 0.04]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.5} />
      </mesh>
      {/* Head (sphere) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#f3e9d4" roughness={0.5} />
      </mesh>
      {/* Hair (half sphere on top) */}
      <mesh position={[0, 1.12, -0.02]}>
        <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a1f15" roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 1.05, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#1a1208" />
      </mesh>
      <mesh position={[0.08, 1.05, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#1a1208" />
      </mesh>
      {/* Left arm */}
      <group position={[-0.3, 0.65, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshStandardMaterial color="#f3e9d4" roughness={0.5} />
        </mesh>
      </group>
      {/* Right arm */}
      <group position={[0.3, 0.65, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshStandardMaterial color="#f3e9d4" roughness={0.5} />
        </mesh>
      </group>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.12, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.6} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.12, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.6} />
      </mesh>

      {/* Activity props */}
      {activity === "mic" && (
        <mesh position={[0.3, 1.3, 0.1]}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
          <meshStandardMaterial color="#1a1208" metalness={0.8} />
        </mesh>
      )}
      {activity === "phone" && (
        <mesh position={[0.28, 1.15, 0.05]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.08, 0.15, 0.04]} />
          <meshStandardMaterial color="#1a1208" />
        </mesh>
      )}
      {activity === "reading" && (
        <mesh position={[0, 0.85, 0.2]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.6} />
        </mesh>
      )}
      {activity === "magnifying" && (
        <group position={[0.35, 1.1, 0.15]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 8, 16]} />
            <meshStandardMaterial color="#b8924a" metalness={0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.1, 16]} />
            <meshPhysicalMaterial color="#f0b865" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
      {activity === "studious" && (
        <>
          {/* Graduation cap */}
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[0.35, 0.04, 0.35]} />
            <meshStandardMaterial color="#1a1208" />
          </mesh>
          <mesh position={[0, 1.32, 0]}>
            <boxGeometry args={[0.15, 0.06, 0.15]} />
            <meshStandardMaterial color="#1a1208" />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ---------- Camera follows character ---------- */
function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(...target));

  useFrame(() => {
    // Smoothly interpolate target
    targetRef.current.lerp(new THREE.Vector3(target[0], target[1], target[2]), 0.05);
    // Camera position: offset from target
    const camX = targetRef.current.x;
    const camY = targetRef.current.y + 8;
    const camZ = targetRef.current.z + 6;
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05);
    camera.lookAt(targetRef.current.x, 0, targetRef.current.z);
  });

  return null;
}

/* ---------- Main Scene ---------- */
function Scene({
  activeSection,
  onZoneEnter,
}: {
  activeSection: string;
  onZoneEnter: (id: string) => void;
}) {
  const [charPos, setCharPos] = useState<[number, number, number]>([0, 0, 0]);
  const [charTarget, setCharTarget] = useState<[number, number, number] | null>(null);
  const [currentZone, setCurrentZone] = useState<string>("hero");
  const [hasMoved, setHasMoved] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const charPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const charTargetRef = useRef<[number, number, number] | null>(null);
  const lastReportedZone = useRef<string>("hero");
  const onZoneEnterRef = useRef(onZoneEnter);

  useEffect(() => { onZoneEnterRef.current = onZoneEnter; }, [onZoneEnter]);
  useEffect(() => { charPosRef.current = charPos; }, [charPos]);
  useEffect(() => { charTargetRef.current = charTarget; }, [charTarget]);

  // Set up click handler
  useEffect(() => {
    onZoneClick = (id: string) => {
      const zone = ZONES_3D.find(z => z.id === id);
      if (zone) {
        setCharTarget([zone.position[0], 0, zone.position[2]]);
        charTargetRef.current = [zone.position[0], 0, zone.position[2]];
        setHasMoved(true);
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const moveKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"];
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (moveKeys.includes(key)) {
        e.preventDefault();
        keysRef.current[key] = true;
        setCharTarget(null);
        charTargetRef.current = null;
        if (!hasMoved) setHasMoved(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current) keysRef.current[key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [hasMoved]);

  // Auto-walk from content scroll
  useEffect(() => {
    if (activeSection && activeSection !== currentZone) {
      const zone = ZONES_3D.find(z => z.id === activeSection);
      if (zone) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCharTarget([zone.position[0], 0, zone.position[2]]);
        charTargetRef.current = [zone.position[0], 0, zone.position[2]];
        if (!hasMoved) setHasMoved(true);
      }
    }
  }, [activeSection, currentZone, hasMoved]);

  // Movement + zone detection
  useFrame((_, delta) => {
    const SPEED = 4;
    let dx = 0, dz = 0;
    if (keysRef.current["arrowleft"] || keysRef.current["a"]) dx -= 1;
    if (keysRef.current["arrowright"] || keysRef.current["d"]) dx += 1;
    if (keysRef.current["arrowup"] || keysRef.current["w"]) dz -= 1;
    if (keysRef.current["arrowdown"] || keysRef.current["s"]) dz += 1;

    const hasManual = dx !== 0 || dz !== 0;

    if (charTargetRef.current && !hasManual) {
      const ddx = charTargetRef.current[0] - charPosRef.current[0];
      const ddz = charTargetRef.current[2] - charPosRef.current[2];
      const dist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dist > 0.2) {
        dx = ddx / dist;
        dz = ddz / dist;
      } else {
        setCharTarget(null);
        charTargetRef.current = null;
      }
    }

    if (hasManual || charTargetRef.current) {
      if (dx !== 0 && dz !== 0) {
        const m = Math.sqrt(dx * dx + dz * dz);
        dx /= m; dz /= m;
      }
      const newX = Math.max(-8, Math.min(8, charPosRef.current[0] + dx * SPEED * delta));
      const newZ = Math.max(-6, Math.min(6, charPosRef.current[2] + dz * SPEED * delta));
      charPosRef.current = [newX, 0, newZ];
      setCharPos([newX, 0, newZ]);
    }

    // Zone detection
    const zone = ZONES_3D.find(z => {
      const ddx = charPosRef.current[0] - z.position[0];
      const ddz = charPosRef.current[2] - z.position[2];
      return Math.sqrt(ddx * ddx + ddz * ddz) < 1.8;
    });
    const zoneId = zone ? zone.id : null;
    if (zoneId !== currentZone) {
      setCurrentZone(zoneId || "hero");
      if (zoneId && zoneId !== lastReportedZone.current) {
        const isAutoWalking = charTargetRef.current !== null;
        if (!isAutoWalking) {
          lastReportedZone.current = zoneId;
          onZoneEnterRef.current(zoneId);
        }
      }
    }
    if (charTargetRef.current === null && zoneId && zoneId !== lastReportedZone.current) {
      lastReportedZone.current = zoneId;
      onZoneEnterRef.current(zoneId);
    }
  });

  const currentZoneData = ZONES_3D.find(z => z.id === currentZone);
  const activity = charTarget !== null ? "walking" : (currentZoneData?.activity || "idle");
  const isMoving = charTarget !== null;

  return (
    <>
      <CameraRig target={charPos} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#f0b865" />
      <fog attach="fog" args={["#0a0807", 15, 30]} />

      <Ground activeZone={currentZone} />

      {ZONES_3D.map(zone => (
        <ZoneStructure key={zone.id} zone={zone} active={zone.id === currentZone} />
      ))}

      <Character3D position={charPos} activity={activity} isMoving={isMoving} />
    </>
  );
}

/* ---------- Exported component ---------- */
export function World3D({
  activeSection,
  onZoneEnter,
}: {
  activeSection: string;
  onZoneEnter: (zoneId: string) => void;
}) {
  return (
    <div className="relative">
      <Canvas
        shadows
        camera={{ position: [0, 8, 6], fov: 50 }}
        style={{ width: "100%", height: "100%", aspectRatio: "4 / 3" }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#0a0807"]} />
        <Scene activeSection={activeSection} onZoneEnter={onZoneEnter} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-faint bg-stage/80 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/80 backdrop-blur-sm">
        <span className="text-spotlight/80">●</span> Arrow keys / WASD / Click zones
      </div>
    </div>
  );
}

export { ZONE_LABELS_3D, ZONES_3D };
