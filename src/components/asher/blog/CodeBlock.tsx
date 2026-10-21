"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

type CodeBlockValue = {
  language?: string;
  code?: string;
  wrapLines?: boolean;
  copyButton?: "auto" | "on" | "off";
};

// "Prompt" blocks are meant to be pasted into an AI tool, so they show as
// plain text (no syntax colours) with a copy button on by default. Every
// other language keeps syntax colours and no copy button unless the Studio
// "Copy button" setting is switched to On. Wrapping defaults to on.
export function CodeBlock({ value }: { value: CodeBlockValue }) {
  const [copied, setCopied] = useState(false);
  const code = value?.code || "";
  const language = value?.language || "text";
  const isPrompt = language === "prompt";
  const wrap = value?.wrapLines !== false;
  const showCopy = value?.copyButton === "on" || (value?.copyButton !== "off" && isPrompt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (older browser / insecure context): nothing to do.
    }
  };

  return (
    <div className="relative my-8 overflow-hidden rounded-lg border border-amber-faint text-sm">
      {(isPrompt || showCopy) && (
        <div className="flex items-center justify-between border-b border-amber-faint bg-stage/60 px-4 py-2 print:hidden">
          <span className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight/80">
            {isPrompt ? "Prompt" : language}
          </span>
          {showCopy && (
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy to clipboard"}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone transition-colors hover:text-ivory"
            >
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      )}
      {isPrompt ? (
        <pre
          className="m-0 p-5 font-mono text-[13px] leading-relaxed text-ivory/90"
          style={{ whiteSpace: wrap ? "pre-wrap" : "pre", overflowWrap: wrap ? "anywhere" : "normal", overflowX: wrap ? "visible" : "auto" }}
        >
          {code}
        </pre>
      ) : (
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{ margin: 0, padding: "1.25rem", background: "transparent", overflowX: wrap ? "visible" : "auto" }}
          codeTagProps={{ style: { whiteSpace: wrap ? "pre-wrap" : "pre", overflowWrap: wrap ? "anywhere" : "normal" } }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
}
