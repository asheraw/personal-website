"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
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
  // Clockwise: arrow(1) → Stage(2) → Studio(3) → Heart(4) → Welcome(5) → Contact(6) → Philosophy(7) → Two Callings(8) → At a Glance(9)
  { id: "stage",      label: "The Stage",    position: [0, 0, -4],   color: "#3d2a14", accentColor: "#f0b865", activity: "The Introverted Performer" },
  { id: "coaching",   label: "The Studio",   position: [6, 0, -4],   color: "#2d2417", accentColor: "#d99846", activity: "Presenting Powerfully" },
  { id: "faith",      label: "The Heart",    position: [6, 0, 0],    color: "#2a1f15", accentColor: "#f0b865", activity: "Faith-led Working Principles" },
  { id: "hero",       label: "Welcome",      position: [0, 0, 0],    color: "#3d2a14", accentColor: "#f0b865", activity: "Being Authentic" },
  { id: "contact",    label: "Contact",      position: [-6, 0, 0],   color: "#241c14", accentColor: "#b8924a", activity: "Connect with Asher" },
  { id: "philosophy", label: "Philosophy",   position: [-6, 0, 4],   color: "#2a1f15", accentColor: "#f0b865", activity: "#KeepTryingUntil You Reach Your Goals" },
  { id: "callings",   label: "Two Callings", position: [0, 0, 4],    color: "#2d2417", accentColor: "#d99846", activity: "Blended Expertise" },
  { id: "glance",     label: "At a Glance",  position: [6, 0, 4],    color: "#241c14", accentColor: "#b8924a", activity: "Experienced Jack-of-all-Trades" },
];

const ZONE_LABELS_3D: Record<string, { activity: string; label: string }> = {
  ...Object.fromEntries(ZONES_3D.map(z => [z.id, { activity: z.activity, label: z.label }])),
  directions: { activity: "Move In A Clockwise Direction", label: "Directions" },
};

let onZoneClick = (_id: string) => {};

// Flat arrow shape on the ground — pointing right toward Stage
function ArrowShape() {
  const arrowShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Clean arrow: shaft + arrowhead, centered at origin, pointing right
    shape.moveTo(-0.8, -0.15);   // shaft bottom-left
    shape.lineTo(0.3, -0.15);    // shaft bottom-right (arrowhead base)
    shape.lineTo(0.3, -0.4);     // arrowhead bottom
    shape.lineTo(0.9, 0);        // arrowhead tip
    shape.lineTo(0.3, 0.4);      // arrowhead top
    shape.lineTo(0.3, 0.15);     // shaft top-right
    shape.lineTo(-0.8, 0.15);    // shaft top-left
    shape.closePath();
    return shape;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, 0.04, -4]} scale={1.5}>
      <shapeGeometry args={[arrowShape]} />
      <meshBasicMaterial color="#f0b865" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Ground({ activeZone }: { activeZone: string | null }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1410" roughness={0.85} />
      </mesh>
      {/* Arrow tile at square 1 (top-left, pointing right toward Stage) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, 0.02, -4]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#2a2018" transparent opacity={0.5} />
      </mesh>
      {/* Flat arrow on ground — custom shape pointing right */}
      <ArrowShape />
      {/* Directions label */}
      {/* style={{pointerEvents:"none"}} on Html itself, not just the inner
          div -- drei's Html wraps content in its own absolutely-positioned
          DOM element sitting on top of the canvas, and that wrapper
          defaults to pointer-events:auto regardless of what the child div's
          own inline style says. Left unset, this label's wrapper (sized to
          its rendered pill, positioned right over the zone) silently ate
          clicks meant for the 3D floor tile underneath -- confirmed by
          reading drei's Html source, not guessed. */}
      <Html position={[-6, 1.5, -4]} center distanceFactor={12} occlude={false} style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(20,16,12,0.5)", color: "rgba(245,239,228,0.4)", padding: "4px 12px", borderRadius: "999px", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", border: "1px solid rgba(240,184,101,0.15)", opacity: 0.45, pointerEvents: "none", backdropFilter: "blur(4px)" }}>Directions</div>
      </Html>
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
      {/* Floor mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[1.8, 32]} /><meshStandardMaterial color="#2a1f15" roughness={0.7} /></mesh>
      {/* Heart flat on the ground — large, glowing. No protruding objects. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={1.2}>
        <shapeGeometry args={[heartShape]} />
        <meshStandardMaterial color="#c44d3f" roughness={0.3} metalness={0.4} emissive={active ? "#c44d3f" : "#000000"} emissiveIntensity={active ? 0.7 : 0.2} side={THREE.DoubleSide} />
      </mesh>
      {active && <pointLight position={[0, 1, 0]} intensity={0.4} color="#c44d3f" distance={4} />}
    </group>
  );
}

// At a Glance — classic trophy. Gold parts pushed toward a richer,
// shinier gold (was reading as dull bronze -- higher metalness, lower
// roughness for sharper highlights, plus a brighter point light and a
// scatter of sparkles for the "champion" feel when active) -- the
// wooden base tiers are untouched, they were never the problem.
function MagnifierZone({ active }: { active: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[1.6, 32]} /><meshStandardMaterial color="#241c14" roughness={0.7} /></mesh>
      <group>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.6, 0.15, 16]} /><meshStandardMaterial color="#3a2a1a" roughness={0.5} /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.4, 0.5, 0.1, 16]} /><meshStandardMaterial color="#5a3a1a" roughness={0.5} /></mesh>
        <mesh position={[0, 0.28, 0]} castShadow><cylinderGeometry args={[0.35, 0.4, 0.06, 16]} /><meshStandardMaterial color="#d4a94f" metalness={0.95} roughness={0.08} /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 0.5, 12]} /><meshStandardMaterial color="#ffd447" metalness={1} roughness={0.04} /></mesh>
        <mesh position={[0, 1.0, 0]} castShadow scale={[1, 0.7, 1]}><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color="#ffd447" metalness={1} roughness={0.03} emissive={active ? "#ffd447" : "#000000"} emissiveIntensity={active ? 0.5 : 0} /></mesh>
        <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.38, 0.38, 0.04, 24]} /><meshStandardMaterial color="#ffd447" metalness={1} roughness={0.03} /></mesh>
        <mesh position={[0, 1.23, 0]}><cylinderGeometry args={[0.35, 0.35, 0.04, 24]} /><meshStandardMaterial color="#8b5a2b" roughness={0.5} /></mesh>
        <mesh position={[-0.48, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.22, 0.05, 12, 24, Math.PI * 1.2]} /><meshStandardMaterial color="#ffd447" metalness={1} roughness={0.05} /></mesh>
        <mesh position={[0.48, 1.0, 0]} rotation={[0, 0, -Math.PI / 2]}><torusGeometry args={[0.22, 0.05, 12, 24, Math.PI * 1.2]} /><meshStandardMaterial color="#ffd447" metalness={1} roughness={0.05} /></mesh>
        <mesh position={[0, 0.95, 0.38]}><boxGeometry args={[0.08, 0.15, 0.02]} /><meshStandardMaterial color="#c44d3f" metalness={0.7} emissive={active ? "#c44d3f" : "#000000"} emissiveIntensity={active ? 0.4 : 0} /></mesh>
      </group>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.9} color="#ffd447" distance={5} />}
      {active && <Sparkles count={24} scale={[1.4, 1.8, 1.4]} position={[0, 0.9, 0]} size={3} speed={0.3} color="#ffe9a8" />}
    </group>
  );
}

// Welcome — flat plaza with star
function WelcomePlaza({ active }: { active: boolean }) {
  // Proper 5-pointed star shape — point UP (not upside down)
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerR = 0.6;
    const innerR = 0.25;
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      // Start at top (Math.PI / 2) so the first point points UP after ground rotation
      const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);
  return (
    <group>
      {/* Floor mat — no circle, just the ground tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#3d2a14" roughness={0.6} />
      </mesh>
      {/* Small 5-pointed star on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry args={[starShape]} />
        <meshStandardMaterial color="#f0b865" metalness={0.7} roughness={0.2} emissive={active ? "#f0b865" : "#000000"} emissiveIntensity={active ? 0.6 : 0.2} side={THREE.DoubleSide} />
      </mesh>
      {active && <pointLight position={[0, 1.5, 0]} intensity={0.3} color="#f0b865" distance={4} />}
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
      {/* HTML label -- style={{pointerEvents:"none"}} on Html itself, not
          just the inner div (see the matching comment on the Directions
          label above): drei's own wrapper div defaults to pointer-events:
          auto, and was swallowing clicks meant for the invisible clickable
          box / floor tile beneath it. */}
      <Html position={[0, 4.2, 0]} center distanceFactor={12} occlude={false} style={{ pointerEvents: "none" }}>
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
  // The cap badge is drawn onto a canvas at runtime and used as a plane
  // texture -- lets it render "胡" crisply using whatever CJK-capable
  // font the browser already has, without shipping a font file just for
  // one glyph the way troika-text or a custom geometry would need.
  const capBadge = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#f0b865";
    ctx.font = "700 100px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("胡", 64, 68);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.04;
    if (innerRef.current) { const currentRot = innerRef.current.rotation.y; let diff = facing - currentRot; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; innerRef.current.rotation.y = currentRot + diff * 0.15; }
    if (isMoving) {
      // The walk cycle only ever drove rotation.x (the swing) -- rotation.z
      // was whatever a zone's idle pose last lerped it to (arms flung wide
      // at "hero", crossed-in at "philosophy", etc.) and just sat there
      // untouched for the whole walk. Combined with the swinging x-rotation,
      // that stale z-rotation is exactly what read as the arms "shrinking"
      // mid-walk from the steep top-down camera -- a limb rotated on two
      // axes at once foreshortens, and only straightened back out once the
      // idle-pose branch below (which does reset both axes) took over on
      // arrival. Lerping z back to 0 here too, same 0.1 factor as that idle
      // branch uses, keeps the arms hanging naturally throughout the walk
      // instead of only fixing themselves at the destination.
      const phase = t * 10;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(phase) * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(phase) * 0.6;
      if (leftArmRef.current) { leftArmRef.current.rotation.x = -Math.sin(phase) * 0.5; leftArmRef.current.rotation.z += (0 - leftArmRef.current.rotation.z) * 0.1; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = Math.sin(phase) * 0.5; rightArmRef.current.rotation.z += (0 - rightArmRef.current.rotation.z) * 0.1; }
    }
    else {
      const setArm = (ref: React.RefObject<THREE.Group>, rotX: number, rotZ: number) => { if (ref.current) { ref.current.rotation.x += (rotX - ref.current.rotation.x) * 0.1; ref.current.rotation.z += (rotZ - ref.current.rotation.z) * 0.1; } };
      const resetLeg = (ref: React.RefObject<THREE.Mesh>) => { if (ref.current) ref.current.rotation.x += (0 - ref.current.rotation.x) * 0.1; };
      resetLeg(leftLegRef); resetLeg(rightLegRef);
      if (zoneId === "coaching") { setArm(leftArmRef, -0.4, 0.2); setArm(rightArmRef, -0.4, -0.2); }
      else if (zoneId === "faith") { setArm(leftArmRef, -0.9, 0.5); setArm(rightArmRef, -0.9, -0.5); }
      // No more magnifying glass to hold up to -- a relaxed "presenting"
      // gesture toward the trophy on the ground instead of a raised arm
      // with nothing in the hand.
      else if (zoneId === "glance") { setArm(rightArmRef, -0.55, -0.2); setArm(leftArmRef, -0.2, 0.1); }
      else if (zoneId === "hero") { setArm(leftArmRef, 0, 1.0); setArm(rightArmRef, 0, -1.0); }
      else if (zoneId === "contact") { setArm(rightArmRef, -1.6, -0.3); setArm(leftArmRef, 0.2, 0); }
      // Both hands raised and angled inward, like holding an open book
      // between them.
      else if (zoneId === "philosophy") { setArm(leftArmRef, -1.1, 0.35); setArm(rightArmRef, -1.1, -0.35); }
      else { setArm(leftArmRef, 0, 0); setArm(rightArmRef, 0, 0); }
    }
  });
  return (
    <group ref={groupRef} position={position}>
      <group ref={innerRef}>
        <mesh position={[0, 0.5, 0]} castShadow><capsuleGeometry args={[0.25, 0.4, 8, 16]} /><meshStandardMaterial color="#d99846" roughness={0.5} /></mesh>
        <mesh position={[0, 0.7, 0.22]}><boxGeometry args={[0.14, 0.06, 0.04]} /><meshStandardMaterial color="#c44d3f" roughness={0.4} /></mesh>
        <mesh position={[0, 1.05, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh>
        {/* Cap -- swapped for the mortarboard at Philosophy instead of
            stacking both on the head at once. The game camera looks down
            at a steep angle (see CameraRig below), so a badge mounted on
            the front of the crown facing outward is nearly invisible --
            it's mounted on TOP, tilted to face up toward that camera,
            same logic as a real cap logo you'd actually see from above.
            Crown/brim sized down slightly from the first pass, which was
            swallowing the glasses from this angle. */}
        {zoneId !== "philosophy" && (
          <group>
            <mesh position={[0, 1.14, -0.01]} castShadow>
              <sphereGeometry args={[0.225, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.05]} />
              <meshStandardMaterial color="#1a1208" roughness={0.5} />
            </mesh>
            {/* Brim worn backwards -- at this size and from the steep
                top-down camera, a brim on the front read as a small red
                dot on the face (like a nose) rather than as a cap. Moving
                it to the back reads as an actual snapback and keeps the
                face clear. */}
            <mesh position={[0, 1.05, -0.19]} rotation={[-0.55, 0, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 0.016, 20, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#c44d3f" roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
            {capBadge && (
              // Positioned just outside the crown sphere's surface along
              // its own outward normal -- placed at the sphere's radius
              // exactly (or anywhere inside it), the plane sits buried in
              // solid geometry and the crown's own surface hides it
              // completely, which is what happened on the first pass.
              <mesh position={[0, 1.34, 0.125]} rotation={[-0.98, 0, 0]}>
                <planeGeometry args={[0.13, 0.13]} />
                <meshBasicMaterial map={capBadge} transparent />
              </mesh>
            )}
          </group>
        )}
        {/* Rectangular glasses, replacing the old plain eye dots -- the
            dots are still there as pupils, just smaller and behind the
            lenses now. */}
        <group position={[0, 1.06, 0.2]}>
          <mesh position={[-0.075, 0, 0]}><boxGeometry args={[0.09, 0.055, 0.012]} /><meshStandardMaterial color="#2a2018" roughness={0.3} metalness={0.4} /></mesh>
          <mesh position={[0.075, 0, 0]}><boxGeometry args={[0.09, 0.055, 0.012]} /><meshStandardMaterial color="#2a2018" roughness={0.3} metalness={0.4} /></mesh>
          <mesh position={[-0.075, 0, 0.008]}><boxGeometry args={[0.07, 0.038, 0.006]} /><meshPhysicalMaterial color="#9fd0e8" transparent opacity={0.35} roughness={0.1} /></mesh>
          <mesh position={[0.075, 0, 0.008]}><boxGeometry args={[0.07, 0.038, 0.006]} /><meshPhysicalMaterial color="#9fd0e8" transparent opacity={0.35} roughness={0.1} /></mesh>
          <mesh position={[0, 0.005, 0]}><boxGeometry args={[0.03, 0.01, 0.008]} /><meshStandardMaterial color="#2a2018" roughness={0.3} metalness={0.4} /></mesh>
          <mesh position={[-0.075, 0, 0.003]}><sphereGeometry args={[0.02, 8, 8]} /><meshBasicMaterial color="#1a1208" /></mesh>
          <mesh position={[0.075, 0, 0.003]}><sphereGeometry args={[0.02, 8, 8]} /><meshBasicMaterial color="#1a1208" /></mesh>
        </group>
        <mesh position={[0, 0.96, 0.2]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} /><meshBasicMaterial color="#1a1208" /></mesh>
        <group ref={leftArmRef} position={[-0.3, 0.7, 0]}><mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh></group>
        <group ref={rightArmRef} position={[0.3, 0.7, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color="#f3e9d4" roughness={0.4} /></mesh>
          {zoneId === "contact" && !isMoving && (<mesh position={[0, -0.35, 0.05]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.08, 0.15, 0.03]} /><meshStandardMaterial color="#1a1208" /></mesh>)}
        </group>
        {/* Headset for studio -- bigger and blue now instead of black on
            black against the (also black) cap, which was invisible. Mic
            boom + tip stay black, per Asher's note. */}
        {zoneId === "coaching" && (<group><mesh position={[0, 1.07, 0]}><torusGeometry args={[0.31, 0.045, 8, 16, Math.PI]} /><meshStandardMaterial color="#2ea8ff" metalness={0.5} roughness={0.3} /></mesh><mesh position={[-0.3, 1.05, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#2ea8ff" roughness={0.35} metalness={0.4} /></mesh><mesh position={[0.3, 1.05, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#2ea8ff" roughness={0.35} metalness={0.4} /></mesh><mesh position={[0.19, 0.92, 0.16]} rotation={[0, 0, -0.8]}><cylinderGeometry args={[0.018, 0.018, 0.19, 6]} /><meshStandardMaterial color="#1a1208" metalness={0.6} /></mesh><mesh position={[0.27, 0.83, 0.22]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#1a1208" emissive="#d99846" emissiveIntensity={0.5} /></mesh></group>)}
        {/* Graduation cap -- replaces the everyday cap above instead of
            stacking on top of it (see zoneId !== "philosophy" check). */}
        {zoneId === "philosophy" && (<group position={[0, 1.35, 0]}><mesh castShadow><boxGeometry args={[0.5, 0.04, 0.5]} /><meshStandardMaterial color="#1a1208" roughness={0.3} /></mesh><mesh position={[0, -0.05, 0]}><sphereGeometry args={[0.15, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#1a1208" roughness={0.3} /></mesh><mesh position={[0.24, -0.1, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.008, 0.008, 0.2, 4]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh><mesh position={[0.24, 0.02, 0]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh><mesh position={[0.27, -0.2, 0]}><coneGeometry args={[0.04, 0.06, 6]} /><meshStandardMaterial color="#f0b865" metalness={0.6} /></mesh></group>)}
        {/* Open book, held up in front of the chest -- replaces the old
            reading pose that had nothing actually in his hands. Raised
            above the torso's own height (0.5-0.7) rather than tucked at
            hand-height, so it clears the torso capsule's silhouette and
            stays visible regardless of which way the character happens
            to be facing when it stops (it turns to face the direction it
            was last walking, which the fixed-angle chase camera doesn't
            always agree with -- lower placements kept ending up hidden
            behind the character's own body). */}
        {zoneId === "philosophy" && !isMoving && (<group position={[0, 0.78, 0.22]} rotation={[0.7, 0, 0]}><mesh position={[-0.08, 0, 0]} rotation={[0, 0.18, 0]} castShadow><boxGeometry args={[0.16, 0.02, 0.2]} /><meshStandardMaterial color="#f3e9d4" roughness={0.6} /></mesh><mesh position={[0.08, 0, 0]} rotation={[0, -0.18, 0]} castShadow><boxGeometry args={[0.16, 0.02, 0.2]} /><meshStandardMaterial color="#f3e9d4" roughness={0.6} /></mesh><mesh position={[0, 0.012, 0]}><boxGeometry args={[0.01, 0.006, 0.2]} /><meshStandardMaterial color="#8b5a2b" roughness={0.5} /></mesh></group>)}
        {/* Floating cross for faith -- deliberately NOT gated on
            !isMoving like the hand-held props (book, phone) are. It's a
            floating symbol above the character, not something held in a
            hand that would look wrong mid-stride, and it sits on the
            rotation axis (x=0, z=0) so it turns with the character's
            facing for free without needing its own logic. Was
            accidentally gated on !isMoving before, which (before the
            isMoving bug fix elsewhere) never actually mattered since
            manual movement never set isMoving true -- once that bug was
            fixed, this cross started vanishing on every manual step
            instead of only when leaving the zone. */}
        {zoneId === "faith" && (<group position={[0, 2.2, 0]}><mesh><boxGeometry args={[0.1, 0.6, 0.1]} /><meshStandardMaterial color="#f0b865" metalness={0.8} roughness={0.2} emissive="#f0b865" emissiveIntensity={0.7} /></mesh><mesh position={[0, 0.12, 0]}><boxGeometry args={[0.4, 0.1, 0.1]} /><meshStandardMaterial color="#f0b865" metalness={0.8} roughness={0.2} emissive="#f0b865" emissiveIntensity={0.7} /></mesh><pointLight position={[0, 0, 0]} intensity={0.4} color="#f0b865" distance={3} /></group>)}
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
  // Whether the character is *actually* translating this frame -- was
  // previously read straight off `charTarget !== null`, which is only
  // ever set for click-to-walk/section-linked auto-walking. Manual
  // WASD/arrow movement nulls charTarget out on keydown, so it never
  // counted as "moving": the walk-cycle arm/leg swing never played, and
  // the arms just sat in whatever the current zone's idle pose was,
  // popping between poses as you walked through zones instead of
  // swinging. Tracked here as its own state, updated in the useFrame
  // loop below from the same condition that actually moves the
  // character, so both movement paths trigger the walk cycle.
  const [isMoving, setIsMoving] = useState(false);
  const isMovingRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const charPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const charTargetRef = useRef<[number, number, number] | null>(null);
  const facingRef = useRef(0);
  const lastReportedZone = useRef<string>("hero");
  const onZoneEnterRef = useRef(onZoneEnter);
  const isClickWalking = useRef(false);
  // Which zone a deferred setCurrentZone call is already queued for -- see
  // the useFrame callback below. Guards against scheduling a new
  // setTimeout every single frame while waiting for the first one to land
  // (the `zoneId !== currentZone` check below stays true on every frame
  // until that deferred update actually applies React state).
  const pendingZoneRef = useRef<string | null>(null);

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
    const currentlyMoving = hasManual || charTargetRef.current !== null;
    if (currentlyMoving !== isMovingRef.current) { isMovingRef.current = currentlyMoving; setIsMoving(currentlyMoving); }
    if (hasManual || charTargetRef.current) {
      if (dx !== 0 && dz !== 0) { const m = Math.sqrt(dx * dx + dz * dz); dx /= m; dz /= m; }
      const newX = Math.max(-8, Math.min(8, charPosRef.current[0] + dx * SPEED * delta)); const newZ = Math.max(-6, Math.min(6, charPosRef.current[2] + dz * SPEED * delta));
      charPosRef.current = [newX, 0, newZ]; setCharPos([newX, 0, newZ]);
      if (dx !== 0 || dz !== 0) { const newFacing = Math.atan2(dx, dz); facingRef.current = newFacing; setFacing(newFacing); }
    }
    // Check if on the arrow (directions) tile — at [-6, 0, -4]
    const onArrow = Math.abs(charPosRef.current[0] - (-6)) < 1.8 && Math.abs(charPosRef.current[2] - (-4)) < 1.8;
    const zone = ZONES_3D.find(z => { const ddx = charPosRef.current[0] - z.position[0]; const ddz = charPosRef.current[2] - z.position[2]; return Math.sqrt(ddx * ddx + ddz * ddz) < 1.8; });
    // If on arrow tile and not on a real zone, show "directions"
    const zoneId = zone ? zone.id : (onArrow ? "directions" : null);
    // Deferred, not called synchronously here -- setCurrentZone drives
    // `active={zone.id === currentZone}` on Ground and all 8
    // ZoneStructures, which is what actually shows/hides each zone's
    // active-only lights and (for "At a Glance" specifically) mounts a new
    // Sparkles particle system. That's real work -- geometry + shader
    // material allocation for Sparkles isn't free -- and doing it
    // synchronously inside useFrame, on the same tick as this frame's own
    // Three.js render, is exactly the kind of thing that produces a
    // momentary freeze on the specific frame a zone changes. Deferring
    // past the current frame's paint (same technique as PlayMode.tsx's
    // handleZoneEnter) lets the walk itself stay smooth; the zone
    // highlight/effects land a frame or so later, imperceptibly.
    if (zoneId !== currentZone && pendingZoneRef.current !== zoneId) {
      pendingZoneRef.current = zoneId;
      setTimeout(() => {
        pendingZoneRef.current = null;
        setCurrentZone(zoneId || "hero");
      }, 0);
    }
    // Report zone changes (including "directions") to update the status bar
    if (zoneId && zoneId !== lastReportedZone.current && !charTargetRef.current) { lastReportedZone.current = zoneId; onZoneEnterRef.current(zoneId); }
  });

  const currentZoneData = ZONES_3D.find(z => z.id === currentZone);
  const isDirections = currentZone === "directions";
  const activity = isMoving ? "walking" : (isDirections ? "Move In A Clockwise Direction" : (currentZoneData?.activity || "idle"));

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
