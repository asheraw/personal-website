"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type Zone3D = {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
  accentColor: string;
  activity: string;
};

const ZONES_3D: Zone3D[] = [
  { id: "stage",      label: "The Stage",    position: [-6, 0, -4], color: "#3d2a14", accentColor: "#f0b865", activity: "Standing in the spotlight" },
  { id: "coaching",   label: "The Studio",   position: [0, 0, -4],  color: "#2d2417", accentColor: "#d99846", activity: "Recording a podcast" },
  { id: "faith",      label: "The Heart",    position: [6, 0, -4],  color: "#2a1f15", accentColor: "#f0b865", activity: "In prayer" },
  { id: "glance",     label: "At a Glance",  position: [-6, 0, 0],  color: "#241c14", accentColor: "#b8924a", activity: "Examining achievements" },
  { id: "hero",       label: "Welcome",      position: [0, 0, 0],   color: "#3d2a14", accentColor: "#f0b865", activity: "Welcoming you" },
  { id: "callings",   label: "Two Callings", position: [6, 0, 0],   color: "#2d2417", accentColor: "#d99846", activity: "Between two callings" },
  { id: "philosophy", label: "Philosophy",   position: [-6, 0, 4],  color: "#2a1f15", accentColor: "#f0b865", activity: "Studying with books" },
  { id: "contact",    label: "Contact",      position: [0, 0, 4],   color: "#241c14", accentColor: "#b8924a", activity: "On the phone" },
];

const ZONE_LABELS_3D: Record<string, { activity: string; label: string }> = Object.fromEntries(
  ZONES_3D.map(z => [z.id, { activity: z.activity, label: z.label }])
);

let onZoneClick = (_id: string) => {};

function Ground({ activeZone }: { activeZone: string | null }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1410" roughness={0.85} />
      </mesh>
      {ZONES_3D.map((zone) => {
        const isActive = zone.id === activeZone;
        return (
          <mesh key={zone.id} rotation={[-Math.PI / 2, 0, 0]} position={[zone.position[0], 0.02, zone.position[2]]}
            onClick={(e) => { e.stopPropagation(); onZoneClick(zone.id); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "default"; }}>
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial color={isActive ? zone.accentColor : "#2a2018"} transparent opacity={isActive ? 0.5 : 0.7}
              emissive={isActive ? zone.accentColor : "#000000"} emissiveIntensity={isActive ? 0.5 : 0} />
          </mesh>
        );
      })}
      <gridHelper args={[40, 20, "#4a3a28", "#2a2018"]} position={[0, 0.03, 0]} />
    </group>
  );
}

// Theatre Stage
function TheatreStage({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow><boxGeometry args={[3, 0.3, 3]} /><meshStandardMaterial color="#5a3a1a" roughness={0.7} /></mesh>
      <mesh position={[-1.3, 1.5, -1.4]} castShadow><boxGeometry args={[0.4, 2.5, 0.1]} /><meshStandardMaterial color="#c44d3f" roughness={0.6} /></mesh>
      <mesh position={[1.3, 1.5, -1.4]} castShadow><boxGeometry args={[0.4, 2.5, 0.1]} /><meshStandardMaterial color="#c44d3f" roughness={0.6} /></mesh>
      <mesh position={[0, 2.7, -1.4]} castShadow><boxGeometry args={[3, 0.3, 0.1]} /><meshStandardMaterial color="#c44d3f" roughness={0.6} /></mesh>
      <mesh position={[0, 3.5, 0]} castShadow><cylinderGeometry args={[0.15, 0.2, 0.3, 8]} /><meshStandardMaterial color="#1a1208" metalness={0.8} roughness={0.2} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.8 : 0} /></mesh>
      {active && (<><pointLight position={[0, 3, 0]} intensity={0.8} color="#f0b865" distance={6} /><mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.05, 1.4, 2.8, 16, 1, true]} /><meshBasicMaterial color="#f0b865" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} /></mesh></>)}
    </group>
  );
}

// Studio — cinema camera + RGB lights
function Studio({ active }: { active: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[1.6, 32]} /><meshStandardMaterial color="#2d2417" roughness={0.7} /></mesh>
      <mesh position={[0, 0.5, -0.3]} castShadow receiveShadow><boxGeometry args={[2.2, 0.1, 0.8]} /><meshStandardMaterial color="#4a3a1a" roughness={0.5} /></mesh>
      {[[-1, -0.6], [1, -0.6], [-1, 0], [1, 0]].map(([x, z], i) => (<mesh key={i} position={[x, 0.25, -0.3 + z]}><boxGeometry args={[0.08, 0.5, 0.08]} /><meshStandardMaterial color="#3a2a1a" /></mesh>))}
      <mesh position={[0.4, 0.55, -0.3]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.3, 8]} /><meshStandardMaterial color="#1a1208" metalness={0.8} /></mesh>
      <mesh position={[0.4, 0.75, -0.3]} castShadow><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#1a1208" metalness={0.7} roughness={0.3} emissive={active ? "#d99846" : "#000000"} emissiveIntensity={active ? 0.4 : 0} /></mesh>
      {/* Cinema camera */}
      <group position={[1.4, 0, 0.9]}>
        {[0, 1, 2].map(i => { const a = (i / 3) * Math.PI * 2; return (<mesh key={i} position={[Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}><cylinderGeometry args={[0.025, 0.025, 0.45, 6]} /><meshStandardMaterial color="#1a1208" metalness={0.6} /></mesh>); })}
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /><meshStandardMaterial color="#1a1208" metalness={0.7} /></mesh>
        <mesh position={[0, 1.0, 0]} castShadow><boxGeometry args={[0.5, 0.3, 0.35]} /><meshStandardMaterial color="#1a1208" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, 1.0, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.12, 0.15, 0.3, 16]} /><meshStandardMaterial color="#0a0807" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 1.0, -0.45]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.02, 8, 24]} /><meshStandardMaterial color="#c44d3f" emissive="#c44d3f" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 1.0, -0.44]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 16]} /><meshPhysicalMaterial color="#1a3a5a" transparent opacity={0.6} roughness={0.05} metalness={0.8} /></mesh>
        <mesh position={[0, 1.22, 0.1]}><boxGeometry args={[0.15, 0.1, 0.2]} /><meshStandardMaterial color="#1a1208" /></mesh>
        <mesh position={[0, 1.25, 0]}><boxGeometry args={[0.3, 0.04, 0.06]} /><meshStandardMaterial color="#1a1208" metalness={0.7} /></mesh>
        <mesh position={[0.2, 1.1, 0.18]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color={active ? "#ff3333" : "#440000"} /></mesh>
      </group>
      {/* RGB lights */}
      <group position={[-1.4, 0, -0.5]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.04, 0.04, 1, 6]} /><meshStandardMaterial color="#1a1208" metalness={0.7} /></mesh>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 8]} /><meshStandardMaterial color="#1a1208" /></mesh>
        <mesh position={[0, 1.6, 0]} castShadow><boxGeometry args={[0.15, 1.2, 0.5]} /><meshStandardMaterial color="#0a0807" /></mesh>
        <mesh position={[0.08, 1.6, 0]}><planeGeometry args={[0.1, 1.0]} /><meshBasicMaterial color="#00d4ff" transparent opacity={active ? 0.9 : 0.4} side={THREE.DoubleSide} /></mesh>
        {active && <pointLight position={[0.3, 1.6, 0.3]} intensity={0.4} color="#00d4ff" distance={4} />}
      </group>
      <group position={[1.4, 0, -1.2]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.04, 0.04, 1, 6]} /><meshStandardMaterial color="#1a1208" metalness={0.7} /></mesh>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 8]} /><meshStandardMaterial color="#1a1208" /></mesh>
        <mesh position={[0, 1.6, 0]} castShadow><boxGeometry args={[0.15, 1.2, 0.5]} /><meshStandardMaterial color="#0a0807" /></mesh>
        <mesh position={[-0.08, 1.6, 0]}><planeGeometry args={[0.1, 1.0]} /><meshBasicMaterial color="#ff00ff" transparent opacity={active ? 0.9 : 0.4} side={THREE.DoubleSide} /></mesh>
        {active && <pointLight position={[-0.3, 1.6, 0.3]} intensity={0.4} color="#ff00ff" distance={4} />}
      </group>
      <mesh position={[-0.4, 0.58, -0.3]} rotation={[0, 0.3, 0]}><torusGeometry args={[0.15, 0.04, 8, 16]} /><meshStandardMaterial color="#1a1208" roughness={0.4} /></mesh>
      {active && <pointLight position={[0, 2, 0]} intensity={0.2} color="#d99846" distance={4} />}
    </group>
  );
}

// Heart — flat heart on wall, floating cross above character
function Cathedral({ active }: { active: boolean }) {
  const heartShape = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x, y + 0.5);
    shape.bezierCurveTo(x, y + 0.5, x - 0.5, y + 1.1, x - 1, y + 0.5);
    shape.bezierCurveTo(x - 1.5, y - 0.1, x - 1, y - 0.7, x, y - 1.2);
    shape.bezierCurveTo(x + 1, y - 0.7, x + 1.5, y - 0.1, x + 1, y + 0.5);
    shape.bezierCurveTo(x + 0.5, y + 1.1, x, y + 0.5, x, y + 0.5);
    return shape;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[1.8, 32]} /><meshStandardMaterial color="#2a1f15" roughness={0.7} /></mesh>
      <mesh position={[0, 1.5, -1.8]} castShadow><boxGeometry args={[3, 3, 0.15]} /><meshStandardMaterial color="#3a2a1a" roughness={0.7} /></mesh>
      <mesh position={[0, 1.6, -1.7]} scale={0.5}><shapeGeometry args={[heartShape]} /><meshStandardMaterial color="#c44d3f" roughness={0.4} emissive={active ? "#c44d3f" : "#000000"} emissiveIntensity={active ? 0.6 : 0.15} side={THREE.DoubleSide} /></mesh>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.4} color="#c44d3f" distance={4} />}
    </group>
  );
}

// At a Glance — classic trophy
function MagnifierZone({ active }: { active: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[1.6, 32]} /><meshStandardMaterial color="#241c14" roughness={0.7} /></mesh>
      <group>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.6, 0.15, 16]} /><meshStandardMaterial color="#3a2a1a" roughness={0.5} /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.4, 0.5, 0.1, 16]} /><meshStandardMaterial color="#5a3a1a" roughness={0.5} /></mesh>
        <mesh position={[0, 0.28, 0]} castShadow><cylinderGeometry args={[0.35, 0.4, 0.06, 16]} /><meshStandardMaterial color="#b8924a" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 0.5, 12]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 1.0, 0]} castShadow scale={[1, 0.7, 1]}><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.08} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.25 : 0} /></mesh>
        <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.38, 0.38, 0.04, 24]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.08} /></mesh>
        <mesh position={[0, 1.23, 0]}><cylinderGeometry args={[0.35, 0.35, 0.04, 24]} /><meshStandardMaterial color="#8b5a2b" roughness={0.5} /></mesh>
        <mesh position={[-0.48, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.22, 0.05, 12, 24, Math.PI * 1.2]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0.48, 1.0, 0]} rotation={[0, 0, -Math.PI / 2]}><torusGeometry args={[0.22, 0.05, 12, 24, Math.PI * 1.2]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 0.95, 0.38]}><boxGeometry args={[0.08, 0.15, 0.02]} /><meshStandardMaterial color="#c44d3f" metalness={0.7} emissive={active ? "#c44d3f" : "#000000"} emissiveIntensity={active ? 0.4 : 0} /></mesh>
      </group>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.4} color="#f0b865" distance={5} />}
    </group>
  );
}

// Welcome — flat plaza with star
function WelcomePlaza({ active }: { active: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow><circleGeometry args={[2, 32]} /><meshStandardMaterial color="#3d2a14" roughness={0.6} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}><circleGeometry args={[1, 5]} /><meshStandardMaterial color="#f0b865" metalness={0.7} roughness={0.2} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.6 : 0.2} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}><ringGeometry args={[0.4, 0.5, 32]} /><meshBasicMaterial color="#f0b865" transparent opacity={active ? 0.8 : 0.3} side={THREE.DoubleSide} /></mesh>
      {active && <pointLight position={[0, 2, 0]} intensity={0.4} color="#f0b865" distance={5} />}
    </group>
  );
}

// Two Callings — art on left, money+charts on right
function DramaMasks({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow><boxGeometry args={[4.5, 0.3, 1.5]} /><meshStandardMaterial color="#5a3a1a" roughness={0.6} /></mesh>
      {/* LEFT: Art easel */}
      <group position={[-1.1, 0, 0]}>
        <mesh position={[0, 0.8, -0.1]} castShadow><boxGeometry args={[0.05, 1.4, 0.05]} /><meshStandardMaterial color="#8b5a2b" roughness={0.5} /></mesh>
        <mesh position={[-0.25, 0.5, 0.15]} rotation={[0.5, 0, 0.25]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.4, 6]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
        <mesh position={[0.25, 0.5, 0.15]} rotation={[0.5, 0, -0.25]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.4, 6]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
        <mesh position={[0, 0.9, -0.08]} castShadow><boxGeometry args={[0.7, 0.55, 0.04]} /><meshStandardMaterial color="#f0b865" roughness={0.4} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.2 : 0} /></mesh>
        <mesh position={[-0.15, 1.0, -0.05]}><sphereGeometry args={[0.09, 8, 8]} /><meshBasicMaterial color="#c44d3f" /></mesh>
        <mesh position={[0.1, 0.85, -0.05]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#7ab8d4" /></mesh>
        <mesh position={[0.18, 1.05, -0.05]}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color="#25d366" /></mesh>
        <mesh position={[-0.3, 0.32, 0.3]} rotation={[-Math.PI / 2.2, 0, 0.3]}><circleGeometry args={[0.2, 16]} /><meshStandardMaterial color="#8b5a2b" roughness={0.6} /></mesh>
        <mesh position={[-0.35, 0.34, 0.35]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#c44d3f" /></mesh>
        <mesh position={[-0.25, 0.34, 0.3]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#f0b865" /></mesh>
        <mesh position={[0.35, 0.32, 0.2]}><cylinderGeometry args={[0.06, 0.07, 0.15, 8]} /><meshStandardMaterial color="#4a3a1a" /></mesh>
        <mesh position={[0.35, 0.45, 0.2]}><cylinderGeometry args={[0.01, 0.01, 0.2, 4]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
        <mesh position={[0.37, 0.45, 0.22]}><cylinderGeometry args={[0.01, 0.01, 0.2, 4]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
      </group>
      {/* RIGHT: Chart + coins */}
      <group position={[1.1, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.9, 0.06, 0.4]} /><meshStandardMaterial color="#3a2a1a" roughness={0.5} /></mesh>
        {[0, 1, 2, 3, 4].map(i => (<mesh key={i} position={[-0.32 + i * 0.16, 0.35 + i * 0.08, 0]} castShadow><boxGeometry args={[0.1, 0.25 + i * 0.15, 0.1]} /><meshStandardMaterial color={i >= 3 ? "#25d366" : "#f0b865"} metalness={0.6} roughness={0.3} emissive={active ? (i >= 3 ? "#25d366" : "#f0b865") : "#000000"} emissiveIntensity={active ? 0.3 : 0} /></mesh>))}
        <mesh position={[0.1, 1.2, 0]} rotation={[0, 0, -Math.PI / 4]}><coneGeometry args={[0.08, 0.2, 4]} /><meshStandardMaterial color="#25d366" metalness={0.8} emissive={active ? "#25d366" : "#000000"} emissiveIntensity={active ? 0.5 : 0} /></mesh>
        {[0, 1, 2, 3].map(i => (<mesh key={i} position={[0.35, 0.4 + i * 0.05, 0.25]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.04, 16]} /><meshStandardMaterial color="#f0b865" metalness={0.9} roughness={0.1} /></mesh>))}
        <mesh position={[-0.15, 1.3, 0]} rotation={[0.3, 0, 0]}><torusGeometry args={[0.1, 0.035, 8, 16]} /><meshStandardMaterial color="#25d366" metalness={0.8} roughness={0.1} emissive={active ? "#25d366" : "#000000"} emissiveIntensity={active ? 0.6 : 0} /></mesh>
        <mesh position={[-0.15, 1.3, 0.01]}><boxGeometry args={[0.025, 0.3, 0.01]} /><meshStandardMaterial color="#25d366" metalness={0.8} emissive={active ? "#25d366" : "#000000"} emissiveIntensity={active ? 0.6 : 0} /></mesh>
      </group>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.3} color="#f0b865" distance={4} />}
    </group>
  );
}

// Philosophy — library with graduation cap
function Library({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0.5]} castShadow receiveShadow><boxGeometry args={[2.5, 0.12, 1]} /><meshStandardMaterial color="#6b4a2a" roughness={0.5} /></mesh>
      {[[-1.1, 0.1], [1.1, 0.1], [-1.1, 0.9], [1.1, 0.9]].map(([x, z], i) => (<mesh key={i} position={[x, 0.25, 0.5 + z]}><boxGeometry args={[0.1, 0.5, 0.1]} /><meshStandardMaterial color="#4a3a1a" roughness={0.5} /></mesh>))}
      {[{ x: -0.6, y: 0.62, c: "#c44d3f", s: [0.5, 0.08, 0.35] }, { x: -0.5, y: 0.72, c: "#d99846", s: [0.45, 0.07, 0.32] }, { x: -0.4, y: 0.81, c: "#f0b865", s: [0.4, 0.06, 0.3] }, { x: 0.6, y: 0.62, c: "#8b5a2b", s: [0.4, 0.1, 0.3] }, { x: 0.55, y: 0.74, c: "#b8924a", s: [0.38, 0.08, 0.28] }].map((b, i) => (<mesh key={i} position={[b.x, b.y, 0.5]} castShadow><boxGeometry args={b.s as [number, number, number]} /><meshStandardMaterial color={b.c} roughness={0.6} /></mesh>))}
      <mesh position={[0.9, 0.62, 0.5]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.4, 8]} /><meshStandardMaterial color="#1a1208" metalness={0.7} /></mesh>
      <mesh position={[0.9, 0.85, 0.5]}><coneGeometry args={[0.18, 0.22, 8]} /><meshStandardMaterial color="#f0b865" emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.8 : 0} /></mesh>
      <mesh position={[0, 1.5, -0.6]} castShadow><boxGeometry args={[2.5, 2.2, 0.4]} /><meshStandardMaterial color="#3a2a1a" roughness={0.7} /></mesh>
      {[0.4, 0.9, 1.4, 1.9, 2.4].map((y, row) => [-0.9, -0.5, -0.1, 0.3, 0.7].map((x, col) => (<mesh key={`${row}-${col}`} position={[x, 1.5 + y - 1.5, -0.39]}><boxGeometry args={[0.15, 0.35, 0.03]} /><meshStandardMaterial color={["#c44d3f", "#d99846", "#f0b865", "#8b5a2b", "#b8924a"][(row + col) % 5]} roughness={0.6} /></mesh>)))}
      {active && <pointLight position={[0.9, 1, 0.5]} intensity={0.4} color="#f0b865" distance={3} />}
    </group>
  );
}

// Contact — phone booth with WhatsApp + email icons
function PhoneBooth({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.2, 1.6]} /><meshStandardMaterial color="#3a2a1a" roughness={0.6} /></mesh>
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (<mesh key={i} position={[x, 1.4, z]} castShadow><boxGeometry args={[0.12, 2.6, 0.12]} /><meshStandardMaterial color="#c44d3f" roughness={0.5} /></mesh>))}
      <mesh position={[0, 2.8, 0]} castShadow><boxGeometry args={[1.3, 0.15, 1.3]} /><meshStandardMaterial color="#c44d3f" roughness={0.5} /></mesh>
      {/* 3D phone icon on top */}
      <group position={[0, 3.15, 0]}>
        <mesh castShadow><boxGeometry args={[0.4, 0.5, 0.08]} /><meshStandardMaterial color="#1a1208" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[0, 0, 0.045]}><planeGeometry args={[0.32, 0.42]} /><meshBasicMaterial color={active ? "#f0b865" : "#2a2018"} /></mesh>
        <mesh position={[0, 0.2, 0.05]}><boxGeometry args={[0.12, 0.02, 0.01]} /><meshBasicMaterial color="#4a3a28" /></mesh>
        <mesh position={[0, -0.22, 0.05]}><cylinderGeometry args={[0.04, 0.04, 0.01, 16]} rotation={[Math.PI / 2, 0, 0]} /><meshBasicMaterial color="#4a3a28" /></mesh>
        {active && <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#f0b865" distance={2} />}
      </group>
      {/* Glass panels */}
      <mesh position={[0, 1.4, 0.5]}><boxGeometry args={[1, 2.4, 0.02]} /><meshPhysicalMaterial color="#f0b865" transparent opacity={0.12} roughness={0.1} transmission={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.4, -0.5]}><boxGeometry args={[1, 2.4, 0.02]} /><meshPhysicalMaterial color="#f0b865" transparent opacity={0.12} roughness={0.1} transmission={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-0.5, 1.4, 0]}><boxGeometry args={[0.02, 2.4, 1]} /><meshPhysicalMaterial color="#f0b865" transparent opacity={0.12} roughness={0.1} transmission={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.5, 1.4, 0]}><boxGeometry args={[0.02, 2.4, 1]} /><meshPhysicalMaterial color="#f0b865" transparent opacity={0.12} roughness={0.1} transmission={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.5, -0.3]} castShadow><boxGeometry args={[0.15, 0.25, 0.05]} /><meshStandardMaterial color="#1a1208" /></mesh>
      {/* WhatsApp icon (left) */}
      <group position={[-1.5, 0, 0.3]}>
        <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.8, 8]} /><meshStandardMaterial color="#3a2a1a" metalness={0.6} /></mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.15, 0.18, 0.04, 12]} /><meshStandardMaterial color="#2a2018" /></mesh>
        <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.06, 24]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color={active ? "#25d366" : "#1a5a30"} metalness={0.4} roughness={0.3} emissive={active ? "#25d366" : "#000000"} emissiveIntensity={active ? 0.4 : 0} /></mesh>
        <mesh position={[0, 0.9, 0.05]} rotation={[Math.PI / 2, 0, 0.3]}><torusGeometry args={[0.12, 0.05, 8, 16, Math.PI * 1.3]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
      {/* Email icon (right) */}
      <group position={[1.5, 0, 0.3]}>
        <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.8, 8]} /><meshStandardMaterial color="#3a2a1a" metalness={0.6} /></mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.15, 0.18, 0.04, 12]} /><meshStandardMaterial color="#2a2018" /></mesh>
        <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.45, 0.3, 0.05]} /><meshStandardMaterial color={active ? "#f0b865" : "#5a4a30"} metalness={0.3} roughness={0.4} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.3 : 0} /></mesh>
        <mesh position={[0, 0.9, 0.03]}><coneGeometry args={[0.22, 0.2, 4]} rotation={[Math.PI / 2, 0, Math.PI / 4]} /><meshStandardMaterial color={active ? "#d99846" : "#4a3a20"} roughness={0.4} /></mesh>
      </group>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.4} color="#f0b865" distance={3} />}
    </group>
  );
}

// Zone with HTML label
function ZoneStructure({ zone, active }: { zone: Zone3D; active: boolean }) {
  return (
    <group position={zone.position}>
      {zone.id === "stage" && <TheatreStage active={active} />}
      {zone.id === "coaching" && <Studio active={active} />}
      {zone.id === "faith" && <Cathedral active={active} />}
      {zone.id === "glance" && <MagnifierZone active={active} />}
      {zone.id === "hero" && <WelcomePlaza active={active} />}
      {zone.id === "callings" && <DramaMasks active={active} />}
      {zone.id === "philosophy" && <Library active={active} />}
      {zone.id === "contact" && <PhoneBooth active={active} />}
      {/* Invisible clickable box */}
      <mesh position={[0, 1.5, 0]} onClick={(e) => { e.stopPropagation(); onZoneClick(zone.id); }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "default"; }}>
        <boxGeometry args={[3.8, 3, 3.8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* HTML label */}
      <Html position={[0, 4.2, 0]} center distanceFactor={12} occlude={false}>
        <div style={{ background: active ? zone.accentColor : "rgba(20,16,12,0.5)", color: active ? "#1a1208" : "rgba(245,239,228,0.4)", padding: "4px 12px", borderRadius: "999px", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", border: active ? `1px solid ${zone.accentColor}` : "1px solid rgba(240,184,101,0.15)", boxShadow: active ? `0 0 12px ${zone.accentColor}80` : "none", opacity: active ? 1 : 0.45, transition: "all 0.3s", pointerEvents: "none", backdropFilter: "blur(4px)" }}>{zone.label}</div>
      </Html>
    </group>
  );
}

// 3D Character
function Character3D({ position, activity, isMoving, facing, zoneId }: { position: [number, number, number]; activity: string; isMoving: boolean; facing: number; zoneId: string; }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.04;
    if (innerRef.current) { const currentRot = innerRef.current.rotation.y; let diff = facing - currentRot; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; innerRef.current.rotation.y = currentRot + diff * 0.15; }
    if (isMoving) { const phase = t * 10; if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(phase) * 0.6; if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(phase) * 0.6; if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.sin(phase) * 0.5; if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(phase) * 0.5; }
    else {
      const setArm = (ref: React.RefObject<THREE.Group>, rotX: number, rotZ: number) => { if (ref.current) { ref.current.rotation.x += (rotX - ref.current.rotation.x) * 0.1; ref.current.rotation.z += (rotZ - ref.current.rotation.z) * 0.1; } };
      const resetLeg = (ref: React.RefObject<THREE.Mesh>) => { if (ref.current) ref.current.rotation.x += (0 - ref.current.rotation.x) * 0.1; };
      resetLeg(leftLegRef); resetLeg(rightLegRef);
      if (zoneId === "coaching") { setArm(leftArmRef, -0.4, 0.2); setArm(rightArmRef, -0.4, -0.2); }
      else if (zoneId === "faith") { setArm(leftArmRef, -0.9, 0.5); setArm(rightArmRef, -0.9, -0.5); }
      else if (zoneId === "glance") { setArm(rightArmRef, -1.4, -0.2); setArm(leftArmRef, -0.3, 0); }
      else if (zoneId === "hero") { setArm(leftArmRef, 0, 1.0); setArm(rightArmRef, 0, -1.0); }
      else if (zoneId === "contact") { setArm(rightArmRef, -1.6, -0.3); setArm(leftArmRef, 0.2, 0); }
      else if (zoneId === "philosophy") { setArm(rightArmRef, -1.5, 0.2); setArm(leftArmRef, 0, 0); }
      else { setArm(leftArmRef, 0, 0); setArm(rightArmRef, 0, 0); }
    }
  });
  return (
    <group ref={groupRef} position={position}>
      <group ref={innerRef}>
        <mesh position={[0, 0.5, 0]} castShadow><capsuleGeometry args={[0.25, 0.4, 8, 16]} /><meshStandardMaterial color="#d99846" roughness={0.5} /></mesh>
        <mesh position={[0, 0.7, 0.22]}><boxGeometry args={[0.14, 0.06, 0.04]} /><meshStandardMaterial color="#c44d3f" roughness={0.4} /></mesh>
        <mesh position={[0, 1.05, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh>
        <mesh position={[0, 1.12, -0.02]}><sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#2a1f15" roughness={0.6} /></mesh>
        <mesh position={[-0.08, 1.05, 0.2]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#1a1208" /></mesh>
        <mesh position={[0.08, 1.05, 0.2]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#1a1208" /></mesh>
        <mesh position={[0, 0.96, 0.2]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} /><meshBasicMaterial color="#1a1208" /></mesh>
        <group ref={leftArmRef} position={[-0.3, 0.7, 0]}><mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh></group>
        <group ref={rightArmRef} position={[0.3, 0.7, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh>
          {zoneId === "glance" && !isMoving && (<group position={[0, -0.45, 0.1]} rotation={[0.3, 0, 0]}><mesh><torusGeometry args={[0.22, 0.04, 12, 24]} /><meshStandardMaterial color="#b8924a" metalness={0.8} roughness={0.2} /></mesh><mesh position={[0, 0, 0.02]}><circleGeometry args={[0.19, 24]} /><meshPhysicalMaterial color="#a0c8e0" transparent opacity={0.45} roughness={0.05} transmission={0.5} /></mesh><mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.04, 0.05, 0.25, 8]} /><meshStandardMaterial color="#5a3a1a" roughness={0.4} metalness={0.3} /></mesh><mesh position={[0, -0.15, 0]}><cylinderGeometry args={[0.03, 0.035, 0.08, 8]} /><meshStandardMaterial color="#b8924a" metalness={0.7} /></mesh></group>)}
          {zoneId === "contact" && !isMoving && (<mesh position={[0, -0.35, 0.05]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.08, 0.15, 0.03]} /><meshStandardMaterial color="#1a1208" /></mesh>)}
        </group>
        {/* Headset for studio */}
        {zoneId === "coaching" && (<group><mesh position={[0, 1.05, 0]}><torusGeometry args={[0.24, 0.03, 8, 16, Math.PI]} /><meshStandardMaterial color="#1a1208" metalness={0.6} /></mesh><mesh position={[-0.24, 1.05, 0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#1a1208" roughness={0.4} /></mesh><mesh position={[0.24, 1.05, 0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#1a1208" roughness={0.4} /></mesh><mesh position={[0.15, 0.95, 0.15]} rotation={[0, 0, -0.8]}><cylinderGeometry args={[0.015, 0.015, 0.15, 6]} /><meshStandardMaterial color="#1a1208" metalness={0.6} /></mesh><mesh position={[0.22, 0.88, 0.2]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#1a1208" emissive="#d99846" emissiveIntensity={0.5} /></mesh></group>)}
        {/* Graduation cap */}
        {zoneId === "philosophy" && (<group position={[0, 1.35, 0]}><mesh castShadow><boxGeometry args={[0.5, 0.04, 0.5]} /><meshStandardMaterial color="#1a1208" roughness={0.3} /></mesh><mesh position={[0, -0.05, 0]}><sphereGeometry args={[0.15, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#1a1208" roughness={0.3} /></mesh><mesh position={[0.24, -0.1, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.008, 0.008, 0.2, 4]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh><mesh position={[0.24, 0.02, 0]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh><mesh position={[0.27, -0.2, 0]}><coneGeometry args={[0.04, 0.06, 6]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh></group>)}
        {/* Floating cross for faith */}
        {zoneId === "faith" && !isMoving && (<group position={[0, 2.2, 0]}><mesh><boxGeometry args={[0.1, 0.6, 0.1]} /><meshStandardMaterial color="#f0b865" metalness={0.8} roughness={0.2} emissive="#f0b865" emissiveIntensity={0.7} /></mesh><mesh position={[0, 0.12, 0]}><boxGeometry args={[0.4, 0.1, 0.1]} /><meshStandardMaterial color="#f0b865" metalness={0.8} roughness={0.2} emissive="#f0b865" emissiveIntensity={0.7} /></mesh><pointLight position={[0, 0, 0]} intensity={0.4} color="#f0b865" distance={3} /></group>)}
        <mesh ref={leftLegRef} position={[-0.12, 0.18, 0]} castShadow><capsuleGeometry args={[0.07, 0.25, 4, 8]} /><meshStandardMaterial color="#1a1208" roughness={0.5} /></mesh>
        <mesh ref={rightLegRef} position={[0.12, 0.18, 0]} castShadow><capsuleGeometry args={[0.07, 0.25, 4, 8]} /><meshStandardMaterial color="#1a1208" roughness={0.5} /></mesh>
      </group>
    </group>
  );
}

function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(...target));
  useFrame(() => { targetRef.current.lerp(new THREE.Vector3(target[0], target[1], target[2]), 0.06); const camX = targetRef.current.x; const camY = targetRef.current.y + 9; const camZ = targetRef.current.z + 7; camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.06); camera.lookAt(targetRef.current.x, 0.5, targetRef.current.z); });
  return null;
}

function Scene({ activeSection, onZoneEnter }: { activeSection: string; onZoneEnter: (id: string) => void; }) {
  const [charPos, setCharPos] = useState<[number, number, number]>([0, 0, 0]);
  const [charTarget, setCharTarget] = useState<[number, number, number] | null>(null);
  const [facing, setFacing] = useState(0);
  const [currentZone, setCurrentZone] = useState<string>("hero");
  const [hasMoved, setHasMoved] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const charPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const charTargetRef = useRef<[number, number, number] | null>(null);
  const facingRef = useRef(0);
  const lastReportedZone = useRef<string>("hero");
  const onZoneEnterRef = useRef(onZoneEnter);
  const isClickWalking = useRef(false);

  useEffect(() => { onZoneEnterRef.current = onZoneEnter; }, [onZoneEnter]);
  useEffect(() => { charPosRef.current = charPos; }, [charPos]);
  useEffect(() => { charTargetRef.current = charTarget; }, [charTarget]);

  useEffect(() => {
    onZoneClick = (id: string) => {
      const zone = ZONES_3D.find(z => z.id === id);
      if (zone) { isClickWalking.current = true; setCharTarget([zone.position[0], 0, zone.position[2]]); charTargetRef.current = [zone.position[0], 0, zone.position[2]]; setHasMoved(true); }
    };
  }, []);

  useEffect(() => {
    const moveKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"];
    const down = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (moveKeys.includes(key)) { e.preventDefault(); keysRef.current[key] = true; setCharTarget(null); charTargetRef.current = null; if (!hasMoved) setHasMoved(true); } };
    const up = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (key in keysRef.current) keysRef.current[key] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [hasMoved]);

  useEffect(() => {
    if (isClickWalking.current) return;
    if (activeSection && activeSection !== currentZone) {
      const zone = ZONES_3D.find(z => z.id === activeSection);
      if (zone) { // eslint-disable-next-line react-hooks/set-state-in-effect
        setCharTarget([zone.position[0], 0, zone.position[2]]); charTargetRef.current = [zone.position[0], 0, zone.position[2]]; if (!hasMoved) setHasMoved(true); }
    }
  }, [activeSection, currentZone, hasMoved]);

  useFrame((_, delta) => {
    const SPEED = 4; let dx = 0, dz = 0;
    if (keysRef.current["arrowleft"] || keysRef.current["a"]) dx -= 1;
    if (keysRef.current["arrowright"] || keysRef.current["d"]) dx += 1;
    if (keysRef.current["arrowup"] || keysRef.current["w"]) dz -= 1;
    if (keysRef.current["arrowdown"] || keysRef.current["s"]) dz += 1;
    const hasManual = dx !== 0 || dz !== 0;
    if (charTargetRef.current && !hasManual) {
      const ddx = charTargetRef.current[0] - charPosRef.current[0]; const ddz = charTargetRef.current[2] - charPosRef.current[2]; const dist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dist > 0.2) { dx = ddx / dist; dz = ddz / dist; }
      else { setCharTarget(null); charTargetRef.current = null; if (isClickWalking.current) { setTimeout(() => { isClickWalking.current = false; }, 500); } }
    }
    if (hasManual && isClickWalking.current) isClickWalking.current = false;
    if (hasManual || charTargetRef.current) {
      if (dx !== 0 && dz !== 0) { const m = Math.sqrt(dx * dx + dz * dz); dx /= m; dz /= m; }
      const newX = Math.max(-8, Math.min(8, charPosRef.current[0] + dx * SPEED * delta)); const newZ = Math.max(-6, Math.min(6, charPosRef.current[2] + dz * SPEED * delta));
      charPosRef.current = [newX, 0, newZ]; setCharPos([newX, 0, newZ]);
      if (dx !== 0 || dz !== 0) { const newFacing = Math.atan2(dx, dz); facingRef.current = newFacing; setFacing(newFacing); }
    }
    const zone = ZONES_3D.find(z => { const ddx = charPosRef.current[0] - z.position[0]; const ddz = charPosRef.current[2] - z.position[2]; return Math.sqrt(ddx * ddx + ddz * ddz) < 1.8; });
    const zoneId = zone ? zone.id : null;
    if (zoneId !== currentZone) setCurrentZone(zoneId || "hero");
    if (zoneId && zoneId !== lastReportedZone.current && !charTargetRef.current) { lastReportedZone.current = zoneId; onZoneEnterRef.current(zoneId); }
  });

  const currentZoneData = ZONES_3D.find(z => z.id === currentZone);
  const activity = charTarget !== null ? "walking" : (currentZoneData?.activity || "idle");
  const isMoving = charTarget !== null;

  return (
    <>
      <CameraRig target={charPos} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 15, 8]} intensity={1.0} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} color="#f0b865" />
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#f0b865" distance={15} />
      <fog attach="fog" args={["#1a1410", 25, 45]} />
      <Ground activeZone={currentZone} />
      {ZONES_3D.map(zone => (<ZoneStructure key={zone.id} zone={zone} active={zone.id === currentZone} />))}
      <Character3D position={charPos} activity={activity} isMoving={isMoving} facing={facing} zoneId={currentZone} />
    </>
  );
}

export function World3D({ activeSection, onZoneEnter }: { activeSection: string; onZoneEnter: (zoneId: string) => void; }) {
  return (
    <div className="relative">
      <Canvas shadows camera={{ position: [0, 9, 7], fov: 50 }} style={{ width: "100%", height: "100%", aspectRatio: "4 / 3" }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#1a1410"]} />
        <Scene activeSection={activeSection} onZoneEnter={onZoneEnter} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-faint bg-stage/80 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/80 backdrop-blur-sm"><span className="text-spotlight/80">●</span> Arrow keys / WASD / Click zones</div>
    </div>
  );
}

export { ZONE_LABELS_3D, ZONES_3D };
