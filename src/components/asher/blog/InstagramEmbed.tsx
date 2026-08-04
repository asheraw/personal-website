"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";

// Instagram's own official embed -- a <blockquote> Instagram's own
// embed.js scans for and hydrates into the real, rich embed (photo,
// caption, account, like count, "View this post on Instagram" link).
// Loaded once per page regardless of how many Instagram embeds appear;
// re-processed on mount so an embed added via client-side navigation
// (e.g. clicking to a different post) still hydrates even though the
// script itself was already loaded on a previous page.
export function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    if (document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`)) {
      // Already loading from another embed mounted moments earlier --
      // its own onload will process every blockquote present once ready.
      return;
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [url]);

  return (
    <div className="my-8 flex justify-center">
      {/* eslint-disable-next-line react/no-unknown-property -- Instagram's own required embed attributes */}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-captioned=""
        data-instgrm-version="14"
        style={{ maxWidth: 540, width: "100%", margin: 0 }}
      >
        <a href={url} target="_blank" rel="noreferrer">
          View this post on Instagram
        </a>
      </blockquote>
    </div>
  );
}
