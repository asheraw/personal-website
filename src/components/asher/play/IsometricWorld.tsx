"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ============================================================
   IsometricWorld — 3D isometric diorama for Play Mode v2
   - 8 zone "buildings" arranged on an isometric grid
   - Cute 3D character that walks between zones
   - Click-to-move + arrow key/WASD controls
   - Character does zone-specific activities
   - Bidirectional sync with content panel
   ============================================================ */

export type IsoActivity =
  | "idle" | "walking"
  | "mic" | "singing" | "reading" | "magnifying"
  | "masks" | "studious" | "phone" | "welcome";

type IsoZone = {
  id: string;
  label: string;
  // Grid position (col, row) on the isometric floor
  col: number;
  row: number;
  activity: IsoActivity;
  color: string;
  roofColor: string;
  icon: string;
};

// 8 zones arranged in a 3x3 grid (center = spawn point, empty)
const ISO_ZONES: IsoZone[] = [
  { id: "stage",      label: "The Stage",    col: 0, row: 0, activity: "mic",         color: "#3d2a14", roofColor: "#f0b865", icon: "🎭" },
  { id: "coaching",   label: "The Studio",   col: 1, row: 0, activity: "singing",     color: "#2d2417", roofColor: "#d99846", icon: "🎤" },
  { id: "faith",      label: "The Heart",    col: 2, row: 0, activity: "reading",     color: "#2a1f15", roofColor: "#c44d3f", icon: "✝" },
  { id: "glance",     label: "At a Glance",  col: 0, row: 1, activity: "magnifying",  color: "#241c14", roofColor: "#b8924a", icon: "🔍" },
  { id: "hero",       label: "Welcome",      col: 1, row: 1, activity: "welcome",     color: "#3d2a14", roofColor: "#f0b865", icon: "★" },
  { id: "callings",   label: "Two Callings", col: 2, row: 1, activity: "masks",       color: "#2d2417", roofColor: "#d99846", icon: "🎭" },
  { id: "philosophy", label: "Philosophy",   col: 0, row: 2, activity: "studious",    color: "#2a1f15", roofColor: "#c44d3f", icon: "📚" },
  { id: "contact",    label: "Contact",      col: 1, row: 2, activity: "phone",       color: "#241c14", roofColor: "#b8924a", icon: "📞" },
];

const ISO_ZONE_LABELS: Record<string, { activity: string; label: string }> = {
  stage:      { activity: "Holding a microphone",         label: "The Stage" },
  coaching:   { activity: "Singing with musical notes",   label: "The Studio" },
  faith:      { activity: "Reading the Bible",            label: "The Heart" },
  glance:     { activity: "Examining with a magnifying glass", label: "At a Glance" },
  hero:       { activity: "Welcoming you",                label: "Welcome" },
  callings:   { activity: "Holding the masks",            label: "Two Callings" },
  philosophy: { activity: "Studying with books",          label: "Philosophy" },
  contact:    { activity: "Talking on the phone",         label: "Contact" },
};

// Isometric tile dimensions
const TILE_W = 120;
const TILE_H = 60;
const BUILDING_H = 80;

// Convert grid (col, row) to isometric screen position
function gridToIso(col: number, row: number) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

export function IsometricWorld({
  activeSection,
  onZoneEnter,
}: {
  activeSection: string;
  onZoneEnter: (zoneId: string) => void;
}) {
  const [charPos, setCharPos] = useState({ col: 1, row: 1 }); // Start at center (Welcome)
  const [charTarget, setCharTarget] = useState<{ col: number; row: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<string>("hero");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastReportedZone = useRef<string>("hero");
  const onZoneEnterRef = useRef(onZoneEnter);
  const animFrame = useRef<number>(0);
  const charPosRef = useRef({ col: 1, row: 1 });
  const charTargetRef = useRef<{ col: number; row: number } | null>(null);

  useEffect(() => { onZoneEnterRef.current = onZoneEnter; }, [onZoneEnter]);

  // Keep refs in sync
  useEffect(() => { charPosRef.current = charPos; }, [charPos]);
  useEffect(() => { charTargetRef.current = charTarget; }, [charTarget]);

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

  // Auto-walk when activeSection changes (from content scroll)
  useEffect(() => {
    if (activeSection && activeSection !== currentZone) {
      const zone = ISO_ZONES.find(z => z.id === activeSection);
      if (zone) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCharTarget({ col: zone.col, row: zone.row });
        charTargetRef.current = { col: zone.col, row: zone.row };
        if (!hasMoved) setHasMoved(true);
      }
    }
  }, [activeSection, currentZone, hasMoved]);

  // Character movement loop
  useEffect(() => {
    const SPEED = 0.04; // grid units per frame
    let lastTime = performance.now();

    const update = (now: number) => {
      const dt = Math.min(50, now - lastTime) / 16.67; // normalize to ~60fps
      lastTime = now;

      let dx = 0, dy = 0;
      // Keyboard input (grid-relative: up = row-1, down = row+1, left = col-1, right = col+1)
      if (keysRef.current["arrowleft"] || keysRef.current["a"]) dx -= 1;
      if (keysRef.current["arrowright"] || keysRef.current["d"]) dx += 1;
      if (keysRef.current["arrowup"] || keysRef.current["w"]) dy -= 1;
      if (keysRef.current["arrowdown"] || keysRef.current["s"]) dy += 1;

      const hasManual = dx !== 0 || dy !== 0;

      // Auto-walk to target
      if (charTargetRef.current && !hasManual) {
        const target = charTargetRef.current;
        const ddx = target.col - charPosRef.current.col;
        const ddy = target.row - charPosRef.current.row;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist > 0.05) {
          dx = ddx / dist;
          dy = ddy / dist;
        } else {
          setCharTarget(null);
          charTargetRef.current = null;
        }
      }

      if (hasManual || charTargetRef.current) {
        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
          const m = Math.sqrt(dx * dx + dy * dy);
          dx /= m; dy /= m;
        }
        const newCol = Math.max(0, Math.min(2, charPosRef.current.col + dx * SPEED * dt));
        const newRow = Math.max(0, Math.min(2, charPosRef.current.row + dy * SPEED * dt));
        charPosRef.current = { col: newCol, row: newRow };
        setCharPos({ col: newCol, row: newRow });
      }

      // Zone detection — find which zone the character is on
      const zone = ISO_ZONES.find(z => {
        return Math.abs(charPosRef.current.col - z.col) < 0.4 && Math.abs(charPosRef.current.row - z.row) < 0.4;
      });
      const zoneId = zone ? zone.id : null;
      if (zoneId !== currentZone) {
        setCurrentZone(zoneId || "hero");
        // Report zone changes
        if (zoneId && zoneId !== lastReportedZone.current) {
          // Only report if not auto-walking (or if arrived)
          const isAutoWalking = charTargetRef.current !== null;
          if (!isAutoWalking) {
            lastReportedZone.current = zoneId;
            onZoneEnterRef.current(zoneId);
          }
        }
      }
      // When auto-walk arrives, report the zone
      if (charTargetRef.current === null && zoneId && zoneId !== lastReportedZone.current) {
        lastReportedZone.current = zoneId;
        onZoneEnterRef.current(zoneId);
      }

      animFrame.current = requestAnimationFrame(update);
    };

    animFrame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrame.current);
  }, [currentZone]);

  // Click to move
  const handleZoneClick = useCallback((zoneId: string) => {
    const zone = ISO_ZONES.find(z => z.id === zoneId);
    if (zone) {
      setCharTarget({ col: zone.col, row: zone.row });
      charTargetRef.current = { col: zone.col, row: zone.row };
      setHasMoved(true);
    }
  }, []);

  const charIso = gridToIso(charPos.col, charPos.row);
  const currentZoneData = ISO_ZONES.find(z => z.id === currentZone);
  const isMoving = charTarget !== null;

  return (
    <div className="relative">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-amber-faint bg-stage"
        style={{ aspectRatio: "4 / 3", perspective: "1200px" }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(240,184,101,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Isometric scene */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) rotateX(55deg) rotateZ(-45deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Floor tiles */}
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 3 }).map((_, col) => {
              const iso = gridToIso(col, row);
              const isZoneTile = ISO_ZONES.some(z => z.col === col && z.row === row);
              const zone = ISO_ZONES.find(z => z.col === col && z.row === row);
              const isActive = zone && zone.id === currentZone;
              const isHovered = zone && zone.id === hoveredZone;
              return (
                <div
                  key={`${col}-${row}`}
                  className="absolute"
                  style={{
                    left: `${iso.x}px`,
                    top: `${iso.y}px`,
                    width: `${TILE_W}px`,
                    height: `${TILE_H}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Tile floor */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: isActive ? "rgba(240,184,101,0.15)" : isZoneTile ? "rgba(20,16,12,0.6)" : "rgba(10,8,7,0.4)",
                      border: isActive ? "1px solid #f0b865" : isHovered ? "1px solid rgba(240,184,101,0.5)" : "1px solid rgba(240,184,101,0.12)",
                      transform: "rotate(0deg)",
                      transition: "background 0.3s, border 0.3s",
                      cursor: zone ? "pointer" : "default",
                    }}
                    onClick={() => zone && handleZoneClick(zone.id)}
                    onMouseEnter={() => zone && setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />
                </div>
              );
            })
          )}

          {/* Buildings on zone tiles */}
          {ISO_ZONES.map((zone) => {
            const iso = gridToIso(zone.col, zone.row);
            const isActive = zone.id === currentZone;
            return (
              <div
                key={zone.id}
                className="absolute"
                style={{
                  left: `${iso.x}px`,
                  top: `${iso.y}px`,
                  transform: "translate(-50%, -50%)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Building base */}
                <div
                  className="absolute"
                  style={{
                    width: `${TILE_W * 0.7}px`,
                    height: `${TILE_H * 0.7}px`,
                    left: `${-TILE_W * 0.35}px`,
                    top: `${-TILE_H * 0.35}px`,
                    transformStyle: "preserve-3d",
                    transform: `translateZ(${BUILDING_H / 2}px)`,
                  }}
                >
                  {/* Building body — 4 walls */}
                  <BuildingWalls color={zone.color} w={TILE_W * 0.7} d={TILE_H * 0.7} h={BUILDING_H} active={isActive} />
                  {/* Roof */}
                  <div
                    className="absolute"
                    style={{
                      width: `${TILE_W * 0.7}px`,
                      height: `${TILE_H * 0.7}px`,
                      background: zone.roofColor,
                      transform: `translateZ(${BUILDING_H / 2}px)`,
                      opacity: isActive ? 1 : 0.85,
                      boxShadow: isActive ? "0 0 20px rgba(240,184,101,0.4)" : "none",
                      borderRadius: "4px",
                    }}
                  />
                  {/* Icon floating above building */}
                  <div
                    className="absolute font-display text-2xl"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translateZ(${BUILDING_H + 20}px) rotateX(-55deg) rotateZ(45deg)`,
                      color: isActive ? "#f0b865" : "#f5efe4",
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      pointerEvents: "none",
                    }}
                  >
                    {zone.icon}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Character */}
          <IsoCharacter
            isoX={charIso.x}
            isoY={charIso.y}
            activity={isMoving ? "walking" : currentZoneData?.activity || "idle"}
            showBubble={currentZone === "hero" && !hasMoved}
          />
        </div>

        {/* Instructions overlay */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-faint bg-stage/80 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/80 backdrop-blur-sm">
          <span className="text-spotlight/80">●</span> Arrow keys / WASD / Click zones
        </div>

        {/* Hover label */}
        {hoveredZone && hoveredZone !== currentZone && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-spotlight/40 bg-stage/80 px-4 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight backdrop-blur-sm">
            Click to walk to {ISO_ZONES.find(z => z.id === hoveredZone)?.label}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Building walls (3D box) ---------- */
function BuildingWalls({ color, w, d, h, active }: { color: string; w: number; d: number; h: number; active: boolean }) {
  const wallStyle = (transform: string): React.CSSProperties => ({
    position: "absolute",
    background: color,
    border: active ? "1px solid rgba(240,184,101,0.5)" : "1px solid rgba(240,184,101,0.15)",
    transformStyle: "preserve-3d",
    transform,
  });

  return (
    <>
      {/* Top wall (north) */}
      <div style={wallStyle(`translateZ(${h / 2}px) rotateX(90deg)`)} className="left-0 top-0" />
      {/* We use a simpler approach: 4 thin divs as walls */}
      {/* Front face */}
      <div
        className="absolute left-0"
        style={{
          width: `${w}px`,
          height: `${h}px`,
          background: color,
          transform: `translateY(${d / 2}px) translateZ(0px) rotateX(-90deg)`,
          transformOrigin: "top center",
          border: active ? "1px solid rgba(240,184,101,0.4)" : "1px solid rgba(0,0,0,0.2)",
          opacity: 0.9,
        }}
      />
      {/* Back face */}
      <div
        className="absolute left-0"
        style={{
          width: `${w}px`,
          height: `${h}px`,
          background: color,
          transform: `translateY(${-d / 2}px) translateZ(0px) rotateX(90deg)`,
          transformOrigin: "bottom center",
          border: "1px solid rgba(0,0,0,0.2)",
          opacity: 0.7,
        }}
      />
      {/* Left face */}
      <div
        className="absolute"
        style={{
          width: `${d}px`,
          height: `${h}px`,
          background: color,
          transform: `translateX(${-w / 2}px) translateZ(0px) rotateY(-90deg) rotateX(90deg)`,
          transformOrigin: "right center",
          border: "1px solid rgba(0,0,0,0.2)",
          opacity: 0.8,
        }}
      />
      {/* Right face */}
      <div
        className="absolute"
        style={{
          width: `${d}px`,
          height: `${h}px`,
          background: color,
          transform: `translateX(${w / 2}px) translateZ(0px) rotateY(90deg) rotateX(90deg)`,
          transformOrigin: "left center",
          border: active ? "1px solid rgba(240,184,101,0.4)" : "1px solid rgba(0,0,0,0.2)",
          opacity: 0.85,
        }}
      />
    </>
  );
}

/* ---------- Isometric Character ---------- */
function IsoCharacter({
  isoX,
  isoY,
  activity,
  showBubble,
}: {
  isoX: number;
  isoY: number;
  activity: IsoActivity;
  showBubble: boolean;
}) {
  const [bob, setBob] = useState(0);
  const [walkPhase, setWalkPhase] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = now - last;
      last = now;
      setBob(Math.sin(now * 0.003) * 3);
      if (activity === "walking") {
        setWalkPhase(now * 0.01);
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [activity]);

  return (
    <div
      className="absolute"
      style={{
        left: `${isoX}px`,
        top: `${isoY}px`,
        transform: `translate(-50%, -50%) translateZ(${BUILDING_H + 15 + bob}px) rotateX(-55deg) rotateZ(45deg)`,
        transformStyle: "preserve-3d",
        pointerEvents: "none",
      }}
    >
      {/* Shadow on ground */}
      <div
        className="absolute rounded-full"
        style={{
          width: "40px",
          height: "20px",
          background: "rgba(0,0,0,0.3)",
          transform: `translate(-50%, -50%) translateZ(${-BUILDING_H - 15 - bob}px)`,
          left: "0",
          top: "0",
        }}
      />

      {/* Character body — cute 3D version */}
      <div className="relative" style={{ transform: "translate(-50%, -50%)" }}>
        <svg width="36" height="50" viewBox="0 0 36 50" fill="none">
          {/* Legs */}
          {activity === "walking" ? (
            <>
              <motion.Leg x1={14} y1={30} x2={14 + Math.sin(walkPhase) * 4} y2={42} />
              <motion.Leg x1={22} y1={30} x2={22 - Math.sin(walkPhase) * 4} y2={42} />
            </>
          ) : (
            <>
              <line x1="14" y1="30" x2="14" y2="42" stroke="#1a1208" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="22" y1="30" x2="22" y2="42" stroke="#1a1208" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}
          {/* Shoes */}
          <ellipse cx={activity === "walking" ? 14 + Math.sin(walkPhase) * 4 : 14} cy={42} rx="3.5" ry="1.8" fill="#1a1208" />
          <ellipse cx={activity === "walking" ? 22 - Math.sin(walkPhase) * 4 : 22} cy={42} rx="3.5" ry="1.8" fill="#1a1208" />

          {/* Body */}
          <rect x="10" y="16" width="16" height="18" rx="4" fill="#d99846" />
          <rect x="10" y="16" width="16" height="6" rx="4" fill="rgba(255,247,230,0.15)" />

          {/* Bowtie */}
          <polygon points="11,17 16,19 11,21" fill="#c44d3f" />
          <polygon points="25,17 20,19 25,21" fill="#c44d3f" />
          <circle cx="18" cy="19" r="1.2" fill="#1a1208" />

          {/* Arms based on activity */}
          {activity === "mic" && (
            <>
              <line x1="10" y1="22" x2="6" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="22" y2="10" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <rect x="20" y="6" width="5" height="8" rx="2" fill="#1a1208" />
            </>
          )}
          {activity === "singing" && (
            <>
              <line x1="10" y1="22" x2="4" y2="18" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="32" y2="18" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <text x="2" y="12" fontSize="10" fill="#f0b865">♪</text>
              <text x="30" y="10" fontSize="12" fill="#f0b865">♫</text>
            </>
          )}
          {activity === "reading" && (
            <>
              <line x1="10" y1="22" x2="14" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="22" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <rect x="12" y="28" width="12" height="8" rx="1" fill="#8b5a2b" />
              <rect x="13" y="29" width="10" height="6" fill="#f3e9d4" />
            </>
          )}
          {activity === "magnifying" && (
            <>
              <line x1="10" y1="22" x2="6" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="30" y2="14" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <circle cx="32" cy="12" r="5" stroke="#8b5a2b" strokeWidth="2" fill="rgba(240,184,101,0.2)" />
            </>
          )}
          {activity === "masks" && (
            <>
              <line x1="10" y1="22" x2="4" y2="14" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="32" y2="14" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <circle cx="2" cy="10" r="4" fill="#f3e9d4" />
              <circle cx="34" cy="10" r="4" fill="#d99846" />
            </>
          )}
          {activity === "studious" && (
            <>
              <line x1="10" y1="22" x2="8" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="28" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              {/* Graduation cap */}
              <rect x="8" y="2" width="20" height="2" fill="#1a1208" />
              <polygon points="6,4 18,0 30,4 18,8" fill="#1a1208" />
              <line x1="28" y1="4" x2="30" y2="8" stroke="#f0b865" strokeWidth="1" />
              <circle cx="30" cy="8" r="1.5" fill="#f0b865" />
              {/* Glasses */}
              <circle cx="14" cy="14" r="3" stroke="#1a1208" strokeWidth="1" fill="rgba(240,184,101,0.15)" />
              <circle cx="22" cy="14" r="3" stroke="#1a1208" strokeWidth="1" fill="rgba(240,184,101,0.15)" />
              <line x1="17" y1="14" x2="19" y2="14" stroke="#1a1208" strokeWidth="1" />
              {/* Books */}
              <rect x="0" y="42" width="8" height="3" fill="#c44d3f" />
              <rect x="28" y="42" width="8" height="3" fill="#8b5a2b" />
            </>
          )}
          {activity === "phone" && (
            <>
              <line x1="10" y1="22" x2="6" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="24" y2="8" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <rect x="21" y="4" width="6" height="10" rx="1.5" fill="#1a1208" />
              <rect x="22" y="5" width="4" height="7" fill="#f3e9d4" />
            </>
          )}
          {activity === "welcome" && (
            <>
              <line x1="10" y1="22" x2="4" y2="16" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="32" y2="16" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {activity === "idle" && (
            <>
              <line x1="10" y1="22" x2="7" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
              <line x1="26" y1="22" x2="29" y2="30" stroke="#f3e9d4" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* Head */}
          <circle cx="18" cy="10" r="8" fill="#f3e9d4" />
          {/* Hair */}
          {activity !== "studious" && (
            <path d="M10 10 Q18 0 26 10 Q24 4 18 4 Q12 4 10 10 Z" fill="#2a1f15" />
          )}
          {/* Eyes */}
          <circle cx="15" cy="10" r="1.2" fill="#1a1208" />
          <circle cx="21" cy="10" r="1.2" fill="#1a1208" />
          {/* Blush */}
          <circle cx="13" cy="12" r="1.5" fill="rgba(196,77,63,0.3)" />
          <circle cx="23" cy="12" r="1.5" fill="rgba(196,77,63,0.3)" />
          {/* Smile */}
          {activity === "singing" ? (
            <ellipse cx="18" cy="13" rx="2" ry="1.5" fill="#1a1208" />
          ) : (
            <path d="M15 12 Q18 14 21 12" stroke="#1a1208" strokeWidth="1" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {/* Speech bubble for Welcome zone */}
        {showBubble && (
          <div
            className="absolute whitespace-nowrap rounded-lg border border-spotlight/50 bg-[rgba(243,233,212,0.97)] px-3 py-1.5 text-center"
            style={{
              left: "50%",
              bottom: "100%",
              transform: "translate(-50%, -8px) rotateX(55deg) rotateZ(-45deg)",
              marginBottom: "10px",
            }}
          >
            <p className="font-mono-stage text-[11px] font-bold text-[#1a1208]">Use arrow keys,</p>
            <p className="font-mono-stage text-[11px] font-bold text-[#1a1208]">WASD, or click!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Simple animated leg for walking */
function motion_Leg(props: { x1: number; y1: number; x2: number; y2: number }) {
  return <line {...props} stroke="#1a1208" strokeWidth="3.5" strokeLinecap="round" />;
}

// Assign to motion namespace for the JSX above
const motion = { Leg: motion_Leg };

export { ISO_ZONE_LABELS, ISO_ZONES };
