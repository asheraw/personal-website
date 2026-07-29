import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Connect with Asher Aw — WhatsApp, Instagram, YouTube, LinkedIn, TikTok, X, and email.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLATFORMS = ["Facebook", "Instagram", "YouTube", "LinkedIn", "X", "TikTok"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0807",
          backgroundImage: "radial-gradient(ellipse 80% 65% at 50% 8%, rgba(240,184,101,0.35) 0%, rgba(240,184,101,0.08) 40%, rgba(10,8,7,0) 70%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#f0b865",
            opacity: 0.85,
          }}
        >
          Singapore · Actor · Coach · Storyteller
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 128,
            fontWeight: 700,
            color: "#f5efe4",
            letterSpacing: -2,
          }}
        >
          Asher Aw
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 44,
            fontWeight: 600,
            color: "#f0b865",
          }}
        >
          Let&rsquo;s Connect
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            gap: 14,
          }}
        >
          {PLATFORMS.map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                border: "2px solid rgba(240,184,101,0.35)",
                color: "#f5efe4",
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
