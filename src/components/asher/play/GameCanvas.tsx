"use client";

import { useEffect, useRef } from "react";

const WORLD_W = 720;
const WORLD_H = 540;
const SPEED = 200;

export type Activity =
  | "idle" | "walking" | "mic" | "singing" | "reading"
  | "magnifying" | "masks" | "studious" | "phone" | "welcome";

type Zone = {
  id: string; label: string; x: number; y: number; w: number; h: number;
  activity: Activity; icon: string; tint: string;
};

const ZONES: Zone[] = [
  { id: "stage",      label: "The Stage",    x: 40,  y: 40,  w: 200, h: 140, activity: "mic",         icon: "spotlight", tint: "#3d2a14" },
  { id: "coaching",   label: "The Studio",   x: 260, y: 40,  w: 200, h: 140, activity: "singing",     icon: "mic",       tint: "#2d2417" },
  { id: "faith",      label: "The Heart",    x: 480, y: 40,  w: 200, h: 140, activity: "reading",     icon: "bible",     tint: "#2a1f15" },
  { id: "glance",     label: "At a Glance",  x: 40,  y: 200, w: 200, h: 140, activity: "magnifying",  icon: "magnifier", tint: "#241c14" },
  { id: "hero",       label: "Welcome",      x: 260, y: 200, w: 200, h: 140, activity: "welcome",     icon: "star",      tint: "#3d2a14" },
  { id: "callings",   label: "Two Callings", x: 480, y: 200, w: 200, h: 140, activity: "masks",       icon: "masks",     tint: "#2d2417" },
  { id: "philosophy", label: "Philosophy",   x: 40,  y: 360, w: 200, h: 140, activity: "studious",    icon: "book",      tint: "#2a1f15" },
  { id: "contact",    label: "Contact",      x: 260, y: 360, w: 200, h: 140, activity: "phone",       icon: "letter",    tint: "#241c14" },
];

const ZONE_LABELS: Record<string, { activity: string; label: string }> = {
  stage:      { activity: "Holding a microphone",         label: "The Stage" },
  coaching:   { activity: "Singing with musical notes",   label: "The Studio" },
  faith:      { activity: "Reading the Bible",            label: "The Heart" },
  glance:     { activity: "Examining with a magnifying glass", label: "At a Glance" },
  hero:       { activity: "Welcoming you",                label: "Welcome" },
  callings:   { activity: "Holding the masks",            label: "Two Callings" },
  philosophy: { activity: "Studying with books",          label: "Philosophy" },
  contact:    { activity: "Talking on the phone",         label: "Contact" },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawZone(ctx: CanvasRenderingContext2D, zone: Zone, isActive: boolean, isHovered: boolean) {
  ctx.fillStyle = isActive ? zone.tint : "#14100c";
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  if (isActive) {
    const grad = ctx.createRadialGradient(zone.x + zone.w/2, zone.y + zone.h/2, 0, zone.x + zone.w/2, zone.y + zone.h/2, zone.w/1.5);
    grad.addColorStop(0, "rgba(240,184,101,0.18)"); grad.addColorStop(1, "rgba(240,184,101,0)");
    ctx.fillStyle = grad; ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  }
  if (isHovered && !isActive) { ctx.fillStyle = "rgba(240,184,101,0.06)"; ctx.fillRect(zone.x, zone.y, zone.w, zone.h); }
  ctx.strokeStyle = isActive ? "#f0b865" : isHovered ? "rgba(240,184,101,0.5)" : "rgba(240,184,101,0.18)";
  ctx.lineWidth = isActive ? 2 : isHovered ? 1.5 : 1;
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  if (isActive) {
    ctx.strokeStyle = "#f0b865"; ctx.lineWidth = 2.5; const cl = 14;
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y + cl); ctx.lineTo(zone.x, zone.y); ctx.lineTo(zone.x + cl, zone.y);
    ctx.moveTo(zone.x + zone.w - cl, zone.y); ctx.lineTo(zone.x + zone.w, zone.y); ctx.lineTo(zone.x + zone.w, zone.y + cl);
    ctx.moveTo(zone.x, zone.y + zone.h - cl); ctx.lineTo(zone.x, zone.y + zone.h); ctx.lineTo(zone.x + cl, zone.y + zone.h);
    ctx.moveTo(zone.x + zone.w - cl, zone.y + zone.h); ctx.lineTo(zone.x + zone.w, zone.y + zone.h); ctx.lineTo(zone.x + zone.w, zone.y + zone.h - cl);
    ctx.stroke();
  }
  drawIcon(ctx, zone);
  ctx.fillStyle = isActive ? "#f0b865" : "#8a7c66";
  ctx.font = "600 11px ui-monospace, 'Geist Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(zone.label.toUpperCase(), zone.x + zone.w/2, zone.y + zone.h - 16);
  if (isHovered && !isActive) {
    ctx.fillStyle = "rgba(240,184,101,0.7)"; ctx.font = "500 9px ui-monospace, 'Geist Mono', monospace";
    ctx.fillText("CLICK TO WALK", zone.x + zone.w/2, zone.y + zone.h - 30);
  }
}

function drawIcon(ctx: CanvasRenderingContext2D, zone: Zone) {
  const cx = zone.x + zone.w/2, cy = zone.y + 40;
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = "#f0b865"; ctx.strokeStyle = "#f0b865";
  switch (zone.icon) {
    case "spotlight":
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*12, Math.sin(a)*12); ctx.lineTo(Math.cos(a)*18, Math.sin(a)*18); ctx.stroke(); }
      break;
    case "mic":
      ctx.beginPath(); roundRect(ctx, -4, -10, 8, 14, 4); ctx.fill();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-8, 8, 0, 8); ctx.quadraticCurveTo(8, 8, 8, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, 13); ctx.moveTo(-4, 13); ctx.lineTo(4, 13); ctx.stroke();
      break;
    case "bible":
      ctx.fillStyle = "#c44d3f"; roundRect(ctx, -10, -8, 20, 16, 2); ctx.fill();
      ctx.fillStyle = "#f3e9d4"; ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = "#c44d3f"; ctx.fillRect(-1, -5, 2, 10); ctx.fillRect(-4, -2, 8, 2);
      break;
    case "magnifier":
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-2, -2, 7, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "rgba(240,184,101,0.15)"; ctx.beginPath(); ctx.arc(-2, -2, 6, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(9, 9); ctx.stroke();
      break;
    case "star":
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i/10)*Math.PI*2 - Math.PI/2; const r = i%2===0?12:5; const px = Math.cos(a)*r, py = Math.sin(a)*r; if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill();
      break;
    case "masks":
      ctx.fillStyle = "#f3e9d4"; ctx.beginPath(); ctx.arc(-7, 0, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(-9, -1, 1, 0, Math.PI*2); ctx.arc(-5, -1, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(-7, 2, 3, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = "#d99846"; ctx.beginPath(); ctx.arc(7, 0, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(5, -1, 1, 0, Math.PI*2); ctx.arc(9, -1, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 3, 3, Math.PI, Math.PI*2); ctx.stroke();
      break;
    case "book":
      ctx.fillStyle = "#f3e9d4";
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(0, -4); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.lineTo(0, 8); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#8a7c66"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 8); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8, -3+i*3); ctx.lineTo(-2, -2+i*3); ctx.moveTo(2, -2+i*3); ctx.lineTo(8, -3+i*3); ctx.stroke(); }
      break;
    case "letter":
      ctx.fillStyle = "#f3e9d4"; ctx.fillRect(-10, -7, 20, 14);
      ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(0, 2); ctx.lineTo(10, -7); ctx.stroke();
      ctx.strokeRect(-10, -7, 20, 14);
      ctx.fillStyle = "#c44d3f"; ctx.beginPath(); ctx.arc(0, 2, 2.5, 0, Math.PI*2); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawArms(ctx: CanvasRenderingContext2D, activity: Activity, swing: number) {
  ctx.strokeStyle = "#f3e9d4"; ctx.lineWidth = 2.8; ctx.lineCap = "round";
  switch (activity) {
    case "walking": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-13, 5+swing*4); ctx.moveTo(10,-5); ctx.lineTo(13, 5-swing*4); ctx.stroke(); break;
    case "mic": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-13, 6); ctx.moveTo(10,-5); ctx.lineTo(7,-16); ctx.stroke(); break;
    case "singing": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-16,-8); ctx.moveTo(10,-5); ctx.lineTo(16,-8); ctx.stroke(); break;
    case "reading": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-4, 4); ctx.moveTo(10,-5); ctx.lineTo(4, 4); ctx.stroke(); break;
    case "magnifying": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-13, 6); ctx.moveTo(10,-5); ctx.lineTo(6,-12); ctx.stroke(); break;
    case "masks": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-14,-12); ctx.moveTo(10,-5); ctx.lineTo(14,-12); ctx.stroke(); break;
    case "studious": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-6, 8); ctx.moveTo(10,-5); ctx.lineTo(6, 8); ctx.stroke(); break;
    case "phone": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-13, 6); ctx.moveTo(10,-5); ctx.lineTo(8,-18); ctx.stroke(); break;
    case "welcome": ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-16,-10); ctx.moveTo(10,-5); ctx.lineTo(16,-10); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.moveTo(-10,-5); ctx.lineTo(-13, 6); ctx.moveTo(10,-5); ctx.lineTo(13, 6); ctx.stroke(); break;
  }
}

function drawProps(ctx: CanvasRenderingContext2D, activity: Activity, time: number) {
  const t = time * 0.003;
  switch (activity) {
    case "reading":
      ctx.fillStyle = "#8b5a2b"; roundRect(ctx, -7, 4, 14, 9, 1); ctx.fill();
      ctx.fillStyle = "#f3e9d4"; ctx.fillRect(-6, 5, 12, 7);
      ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 0.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5, 6+i*2); ctx.lineTo(-1, 6+i*2); ctx.moveTo(1, 6+i*2); ctx.lineTo(5, 6+i*2); ctx.stroke(); }
      break;
    case "magnifying":
      ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(8, -14, 6, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "rgba(240,184,101,0.2)"; ctx.beginPath(); ctx.arc(8, -14, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(12, -10); ctx.lineTo(15, -7); ctx.stroke();
      break;
    case "masks":
      ctx.fillStyle = "#f3e9d4"; ctx.beginPath(); ctx.arc(-14, -14, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(-15.5, -15, 0.8, 0, Math.PI*2); ctx.arc(-12.5, -15, 0.8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(-14, -12, 2.5, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = "#d99846"; ctx.beginPath(); ctx.arc(14, -14, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(12.5, -15, 0.8, 0, Math.PI*2); ctx.arc(15.5, -15, 0.8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, -11, 2.5, Math.PI, Math.PI*2); ctx.stroke();
      break;
    case "mic":
      ctx.fillStyle = "#1a1208"; roundRect(ctx, 4, -22, 6, 10, 2); ctx.fill();
      ctx.fillStyle = "#8a7c66"; ctx.fillRect(6, -12, 2, 4);
      break;
    case "singing": {
      const no = Math.sin(t*2)*2;
      ctx.fillStyle = "#f0b865";
      ctx.save(); ctx.translate(-16, -24+no); ctx.beginPath(); ctx.ellipse(0, 0, 3, 2.5, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#f0b865"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2.5, 0); ctx.lineTo(2.5, -8); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(14, -22-no); ctx.beginPath(); ctx.ellipse(0, 0, 3, 2.5, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, -1, 3, 2.5, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2.5, 0); ctx.lineTo(2.5, -8); ctx.moveTo(7.5, -1); ctx.lineTo(7.5, -9); ctx.moveTo(2.5, -8); ctx.lineTo(7.5, -9); ctx.stroke(); ctx.restore();
      break;
    }
    case "studious":
      ctx.fillStyle = "#8b5a2b"; ctx.save(); ctx.translate(-22, 8); ctx.fillRect(-1, 0, 12, 4); ctx.fillStyle = "#f3e9d4"; ctx.fillRect(0, 0, 10, 3); ctx.restore();
      ctx.save(); ctx.translate(14, 10); ctx.fillStyle = "#c44d3f"; ctx.fillRect(0, 0, 12, 3); ctx.fillStyle = "#d99846"; ctx.fillRect(1, 3, 12, 3); ctx.fillStyle = "#8b5a2b"; ctx.fillRect(2, 6, 12, 3); ctx.restore();
      ctx.save(); ctx.translate(-6, 14); ctx.fillStyle = "#5a3a1a"; ctx.fillRect(0, 0, 14, 3); ctx.fillStyle = "#f3e9d4"; ctx.fillRect(1, 0, 12, 2); ctx.restore();
      break;
    case "phone":
      ctx.fillStyle = "#1a1208"; roundRect(ctx, 4, -22, 7, 12, 2); ctx.fill();
      ctx.fillStyle = "#f3e9d4"; ctx.fillRect(5, -21, 5, 8);
      ctx.fillStyle = "#f0b865"; ctx.beginPath(); ctx.arc(7.5, -16, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(240,184,101,0.5)"; ctx.lineWidth = 0.8;
      const wp = (Math.sin(t*4)+1)/2; ctx.globalAlpha = wp;
      ctx.beginPath(); ctx.arc(13, -16, 3, -0.6, 0.6); ctx.stroke();
      ctx.globalAlpha = wp*0.6; ctx.beginPath(); ctx.arc(15, -16, 5, -0.5, 0.5); ctx.stroke();
      ctx.globalAlpha = 1;
      break;
  }
}

function drawStudiousAccessories(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#1a1208";
  ctx.beginPath(); ctx.ellipse(0, -30, 10, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(-13, -34); ctx.lineTo(13, -34); ctx.lineTo(10, -30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#f0b865"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(13, -34); ctx.lineTo(15, -28); ctx.stroke();
  ctx.fillStyle = "#f0b865"; ctx.beginPath(); ctx.arc(15, -27, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(-4, -20, 3, 0, Math.PI*2); ctx.arc(4, -20, 3, 0, Math.PI*2); ctx.moveTo(-1, -20); ctx.lineTo(1, -20); ctx.moveTo(-7, -20); ctx.lineTo(-9, -21); ctx.moveTo(7, -20); ctx.lineTo(9, -21); ctx.stroke();
  ctx.fillStyle = "rgba(240,184,101,0.15)"; ctx.beginPath(); ctx.arc(-4, -20, 2.5, 0, Math.PI*2); ctx.arc(4, -20, 2.5, 0, Math.PI*2); ctx.fill();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const bx = -75, by = -70, bw = 150, bh = 44;
  ctx.fillStyle = "rgba(243, 233, 212, 0.97)"; roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, by+bh); ctx.lineTo(-10, by+bh+8); ctx.lineTo(2, by+bh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(240,184,101,0.5)"; ctx.lineWidth = 1.5; roundRect(ctx, bx, by, bw, bh, 8); ctx.stroke();
  ctx.fillStyle = "#1a1208"; ctx.font = "700 12px ui-monospace, 'Geist Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Use arrow keys, WASD,", 0, by + 15);
  ctx.fillText("or click a zone!", 0, by + 31);
  ctx.restore();
}

function drawCharacterBody(ctx: CanvasRenderingContext2D, activity: Activity, time: number) {
  const t = time * 0.003;
  const bob = Math.sin(t*2)*1.2;
  const isWalking = activity === "walking";
  const legSwing = isWalking ? Math.sin(time*0.015)*4 : 0;
  const armSwing = isWalking ? Math.sin(time*0.015) : 0;

  ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(0, 22, 14, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(-4+legSwing, 22); ctx.moveTo(4, 10); ctx.lineTo(4-legSwing, 22); ctx.stroke();
  ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.ellipse(-4+legSwing, 22, 3, 1.5, 0, 0, Math.PI*2); ctx.ellipse(4-legSwing, 22, 3, 1.5, 0, 0, Math.PI*2); ctx.fill();

  ctx.save(); ctx.translate(0, bob);
  ctx.fillStyle = "#d99846"; roundRect(ctx, -10, -10, 20, 22, 5); ctx.fill();
  ctx.fillStyle = "rgba(255, 247, 230, 0.12)"; roundRect(ctx, -10, -10, 20, 8, 5); ctx.fill();
  ctx.fillStyle = "#c44d3f";
  ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-2, -7); ctx.lineTo(-6, -5); ctx.closePath(); ctx.moveTo(6, -9); ctx.lineTo(2, -7); ctx.lineTo(6, -5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(0, -7, 1, 0, Math.PI*2); ctx.fill();
  drawArms(ctx, activity, armSwing);
  ctx.fillStyle = "#f3e9d4"; ctx.beginPath(); ctx.arc(0, -20, 11, 0, Math.PI*2); ctx.fill();
  if (activity !== "studious") {
    ctx.fillStyle = "#2a1f15"; ctx.beginPath(); ctx.arc(0, -22, 11, Math.PI+0.4, Math.PI*2-0.4, false); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, -30); ctx.quadraticCurveTo(0, -34, 3, -30); ctx.fill();
  }
  ctx.fillStyle = "#f3e9d4"; ctx.beginPath(); ctx.arc(-11, -19, 2, 0, Math.PI*2); ctx.arc(11, -19, 2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(196, 77, 63, 0.28)"; ctx.beginPath(); ctx.arc(-6, -17, 2, 0, Math.PI*2); ctx.arc(6, -17, 2, 0, Math.PI*2); ctx.fill();

  const blink = Math.sin(time*0.001) > 0.97;
  const eyesClosedSinging = activity === "singing" && Math.sin(time*0.005) > 0.5;
  if (activity === "studious") {
    ctx.fillStyle = "#1a1208";
    if (blink) { ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5.5,-20); ctx.lineTo(-2.5,-20); ctx.moveTo(2.5,-20); ctx.lineTo(5.5,-20); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-4, -20, 1.4, 0, Math.PI*2); ctx.arc(4, -20, 1.4, 0, Math.PI*2); ctx.fill(); }
  } else if (eyesClosedSinging) {
    ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(-4, -20, 2.5, 0.2, Math.PI-0.2); ctx.arc(4, -20, 2.5, 0.2, Math.PI-0.2); ctx.stroke();
  } else {
    ctx.fillStyle = "#1a1208";
    if (blink) { ctx.lineWidth = 1; ctx.strokeStyle = "#1a1208"; ctx.beginPath(); ctx.moveTo(-5.5,-20); ctx.lineTo(-2.5,-20); ctx.moveTo(2.5,-20); ctx.lineTo(5.5,-20); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-4, -20, 1.6, 0, Math.PI*2); ctx.arc(4, -20, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff7e6"; ctx.beginPath(); ctx.arc(-3.4, -20.6, 0.6, 0, Math.PI*2); ctx.arc(4.6, -20.6, 0.6, 0, Math.PI*2); ctx.fill(); }
  }

  ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 1.2;
  if (activity === "singing") { ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.ellipse(0, -16, 2.5, 2, 0, 0, Math.PI*2); ctx.fill(); }
  else if (activity === "phone") { ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.ellipse(0, -16, 1.5, 1.5+Math.sin(time*0.012)*0.5, 0, 0, Math.PI*2); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, -17, 3, 0.2, Math.PI-0.2); ctx.stroke(); }

  if (activity === "studious") drawStudiousAccessories(ctx);
  drawProps(ctx, activity, time);
  ctx.restore();
}

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, activity: Activity, time: number, facing: number, showBubble: boolean) {
  ctx.save(); ctx.translate(x, y);
  ctx.save(); if (facing < 0) ctx.scale(-1, 1); drawCharacterBody(ctx, activity, time); ctx.restore();
  if (showBubble) drawSpeechBubble(ctx);
  ctx.restore();
}

const DUST: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
for (let i = 0; i < 20; i++) DUST.push({ x: Math.random()*WORLD_W, y: Math.random()*WORLD_H, vx: (Math.random()-0.5)*8, vy: -Math.random()*6-2, r: Math.random()*1.5+0.5, a: Math.random()*0.3+0.1 });

function drawDust(ctx: CanvasRenderingContext2D, dt: number) {
  for (const p of DUST) {
    p.x += p.vx*dt; p.y += p.vy*dt;
    if (p.y < -5) { p.y = WORLD_H+5; p.x = Math.random()*WORLD_W; }
    if (p.x < -5) p.x = WORLD_W+5; if (p.x > WORLD_W+5) p.x = -5;
    ctx.fillStyle = `rgba(240, 184, 101, ${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  }
}

export function GameCanvas({ activeSection, onZoneEnter }: { activeSection: string; onZoneEnter: (zoneId: string) => void; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charRef = useRef({ x: 360, y: 270, vx: 0, vy: 0, facing: 1 });
  const keysRef = useRef<Record<string, boolean>>({});
  const currentZoneRef = useRef<string | null>("hero");
  const targetZoneRef = useRef<string | null>(null);
  const isAutoWalkingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const hoveredZoneRef = useRef<string | null>(null);
  const onZoneEnterRef = useRef(onZoneEnter);
  const lastReportedZoneRef = useRef<string | null>("hero");

  useEffect(() => { onZoneEnterRef.current = onZoneEnter; }, [onZoneEnter]);

  useEffect(() => {
    const moveKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"];
    const down = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (moveKeys.includes(key)) { e.preventDefault(); keysRef.current[key] = true; targetZoneRef.current = null; isAutoWalkingRef.current = false; hasMovedRef.current = true; } };
    const up = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (key in keysRef.current) keysRef.current[key] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (activeSection && activeSection !== currentZoneRef.current) { targetZoneRef.current = activeSection; isAutoWalkingRef.current = true; hasMovedRef.current = true; }
  }, [activeSection]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_W*dpr; canvas.height = WORLD_H*dpr;
    const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.scale(dpr, dpr);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (WORLD_W/rect.width);
      const cy = (e.clientY - rect.top) * (WORLD_H/rect.height);
      const z = ZONES.find(z => cx >= z.x && cx <= z.x+z.w && cy >= z.y && cy <= z.y+z.h);
      if (z) { targetZoneRef.current = z.id; isAutoWalkingRef.current = true; hasMovedRef.current = true; }
    };
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (WORLD_W/rect.width);
      const cy = (e.clientY - rect.top) * (WORLD_H/rect.height);
      const z = ZONES.find(z => cx >= z.x && cx <= z.x+z.w && cy >= z.y && cy <= z.y+z.h) || null;
      hoveredZoneRef.current = z ? z.id : null; canvas.style.cursor = z ? "pointer" : "default";
    };
    canvas.addEventListener("click", handleClick); canvas.addEventListener("mousemove", handleMove);

    let lastTime = performance.now(); let raf = 0;
    const update = (dt: number) => {
      const char = charRef.current;
      let dx = 0, dy = 0;
      if (keysRef.current["arrowleft"] || keysRef.current["a"]) dx -= 1;
      if (keysRef.current["arrowright"] || keysRef.current["d"]) dx += 1;
      if (keysRef.current["arrowup"] || keysRef.current["w"]) dy -= 1;
      if (keysRef.current["arrowdown"] || keysRef.current["s"]) dy += 1;
      const hasManual = dx !== 0 || dy !== 0;
      if (targetZoneRef.current && !hasManual) {
        const target = ZONES.find(z => z.id === targetZoneRef.current);
        if (target) { const tx = target.x+target.w/2, ty = target.y+target.h/2; const ddx = tx-char.x, ddy = ty-char.y; const dist = Math.sqrt(ddx*ddx+ddy*ddy);
          if (dist > 6) { dx = ddx/dist; dy = ddy/dist; } else { targetZoneRef.current = null; isAutoWalkingRef.current = false; } }
      }
      if (hasManual && dx !== 0 && dy !== 0) { const m = Math.sqrt(dx*dx+dy*dy); dx /= m; dy /= m; }
      char.vx = dx*SPEED; char.vy = dy*SPEED;
      char.x += char.vx*dt; char.y += char.vy*dt;
      char.x = Math.max(20, Math.min(WORLD_W-20, char.x)); char.y = Math.max(20, Math.min(WORLD_H-20, char.y));
      if (dx > 0.1) char.facing = 1; else if (dx < -0.1) char.facing = -1;
      let inZone: string | null = null;
      for (const zone of ZONES) { if (char.x >= zone.x && char.x <= zone.x+zone.w && char.y >= zone.y && char.y <= zone.y+zone.h) { inZone = zone.id; break; } }
      if (inZone !== currentZoneRef.current) currentZoneRef.current = inZone;
      const arrived = !targetZoneRef.current && isAutoWalkingRef.current;
      if (inZone && inZone !== lastReportedZoneRef.current) {
        if (isAutoWalkingRef.current && !arrived) {} else { lastReportedZoneRef.current = inZone; onZoneEnterRef.current(inZone); }
      }
      if (arrived) isAutoWalkingRef.current = false;
    };
    const draw = (now: number) => {
      ctx.fillStyle = "#0a0807"; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.strokeStyle = "rgba(240,184,101,0.04)"; ctx.lineWidth = 1;
      for (let x = 0; x <= WORLD_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke(); }
      for (let y = 0; y <= WORLD_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
      drawDust(ctx, 1/60);
      for (const zone of ZONES) drawZone(ctx, zone, zone.id === currentZoneRef.current, zone.id === hoveredZoneRef.current);
      const char = charRef.current;
      const cz = ZONES.find(z => z.id === currentZoneRef.current);
      const isMoving = Math.abs(char.vx) > 1 || Math.abs(char.vy) > 1;
      let activity: Activity = isMoving ? "walking" : cz ? (cz.id === "hero" && !hasMovedRef.current ? "welcome" : cz.activity) : "idle";
      drawCharacter(ctx, char.x, char.y, activity, now, char.facing, activity === "welcome");
    };
    const loop = (now: number) => { const dt = Math.min(0.05, (now-lastTime)/1000); lastTime = now; update(dt); draw(now); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("click", handleClick); canvas.removeEventListener("mousemove", handleMove); };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-auto rounded-2xl border border-amber-faint bg-stage" style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }} aria-label="Interactive game world" role="img" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-faint bg-stage/80 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/80 backdrop-blur-sm">
        <span className="text-spotlight/80">●</span> Arrow keys / WASD / Click zones
      </div>
    </div>
  );
}

export { ZONE_LABELS, ZONES };
