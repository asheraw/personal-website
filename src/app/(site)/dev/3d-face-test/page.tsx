import type { Metadata } from "next";
import { Face3DTestClient } from "@/components/asher/play/Face3DTestClient";

// Internal preview only -- not linked from navigation or the sitemap.
// Lets Asher see the "real photo on a billboard, body turns underneath
// it" approach on the 3D character before it replaces the drawn head on
// the live Character3D in World3D.tsx.
export const metadata: Metadata = {
  title: "3D face test",
  robots: { index: false, follow: false },
};

export default function Face3DTestPage() {
  return (
    <main className="min-h-screen bg-stage px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight/80">
          Internal preview · not linked anywhere
        </p>
        <h1 className="mt-2 font-display text-3xl text-ivory">3D face test</h1>
        <p className="mt-2 max-w-xl text-sm text-stone/70">
          The body spins on its own so you can watch the face without touching anything.
          It&apos;s a photo on a flat plane, billboarded to always face the camera instead
          of turning with the body -- same fix as the 2D character, adapted for 3D since a
          single photo has no back or side to show. Drag to orbit and check it from other
          angles too. Nothing here touches the real 3D world yet.
        </p>
        <div className="mt-8">
          <Face3DTestClient />
        </div>
      </div>
    </main>
  );
}
