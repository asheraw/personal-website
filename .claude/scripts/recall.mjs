#!/usr/bin/env node
// Deterministic retrieval: score every candidate source by keyword overlap
// WITHOUT opening files wholesale, then return only the single best-matching
// section as evidence. No model calls - pure string scoring, runs in ms.
//
// Sources indexed:
//   - every auto-memory file (whole-file, they're already small)
//   - every markdown-heading section of the root project docs
//
// Usage: node .claude/scripts/recall.mjs "your question"

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const MEMORY_DIR = join(homedir(), ".claude", "projects", "d--Work-Website", "memory");

const ROOT_DOCS = [
  "ACE_MASTER_SPEC.md",
  "ACE_PRD.md",
  "BACKUP_AND_RECOVERY_GUIDE.md",
  "CHANGELOG.md",
  "CURRENT_STATE_AUDIT.md",
  "IDEAS.md",
  "IMPLEMENTATION_PLAN.md",
  "RUNBOOK.md",
];

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "did", "do", "does", "what",
  "when", "where", "why", "how", "who", "which", "we", "i", "you", "it",
  "this", "that", "to", "of", "in", "on", "for", "and", "or", "about", "with",
  "decide", "decided", "us", "our", "my", "me", "at", "as", "be", "been",
  "have", "has", "had", "will", "would", "should", "could", "can", "s",
]);

const MAX_TEXT_CHARS = 4000;

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9\-_]*/g) || []).filter(
    (w) => w.length > 1 && !STOPWORDS.has(w)
  );
}

function parseFrontmatterDescription(body) {
  const m = body.match(/^---\r?\n[\s\S]*?description:\s*(.+?)\r?\n/m);
  return m ? m[1].trim() : "";
}

function memoryCandidates() {
  if (!existsSync(MEMORY_DIR)) return [];
  return readdirSync(MEMORY_DIR)
    .filter((f) => f.endsWith(".md") && f !== "MEMORY.md")
    .map((f) => {
      const path = join(MEMORY_DIR, f);
      const body = readFileSync(path, "utf8");
      const description = parseFrontmatterDescription(body);
      return {
        kind: "memory",
        source: `memory/${f}`,
        path,
        heading: `${f.replace(/\.md$/, "")} — ${description}`,
        text: body,
      };
    });
}

function sectionCandidates() {
  const out = [];
  for (const doc of ROOT_DOCS) {
    const path = join(REPO_ROOT, doc);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, "utf8").split("\n");
    let current = { heading: doc, startLine: 1, body: [] };
    const sections = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^#{1,4}\s+(.*)/);
      if (m) {
        if (current.body.length) sections.push(current);
        current = { heading: m[1].trim(), startLine: i + 1, body: [] };
      } else {
        current.body.push(lines[i]);
      }
    }
    if (current.body.length) sections.push(current);
    for (const s of sections) {
      const text = s.body.join("\n").trim();
      if (!text) continue;
      out.push({
        kind: "doc",
        source: doc,
        path,
        heading: s.heading,
        startLine: s.startLine,
        endLine: s.startLine + s.body.length - 1,
        text,
      });
    }
  }
  return out;
}

function scoreCandidate(queryTokens, heading, text) {
  const headingSet = new Set(tokenize(heading));
  const bodyTokens = tokenize(text);
  const bodyFreq = new Map();
  for (const t of bodyTokens) bodyFreq.set(t, (bodyFreq.get(t) || 0) + 1);

  let headingScore = 0;
  let rawBodyScore = 0;
  for (const q of queryTokens) {
    if (headingSet.has(q)) headingScore += 8;
    if (bodyFreq.has(q)) rawBodyScore += Math.min(bodyFreq.get(q), 3);
  }
  // Density-normalize the body score so a long section doesn't out-rank a
  // short precise one purely by repeating keywords more times in more text.
  const density = rawBodyScore / Math.sqrt(Math.max(bodyTokens.length, 20) / 40);
  return headingScore + density;
}

function findPointer(text, excludeSource) {
  const wiki = text.match(/\[\[([a-z0-9\-]+)\]\]/i);
  if (wiki) return { type: "memory", slug: wiki[1] };
  const docMention = text.match(/\b([A-Z_]+\.md)\b/);
  if (docMention && ROOT_DOCS.includes(docMention[1]) && docMention[1] !== excludeSource) {
    return { type: "doc", file: docMention[1] };
  }
  return null;
}

function truncate(text) {
  if (text.length <= MAX_TEXT_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_TEXT_CHARS), truncated: true };
}

function main() {
  const question = process.argv.slice(2).join(" ").trim();
  if (!question) {
    console.error('Usage: node recall.mjs "your question"');
    process.exit(1);
  }
  const queryTokens = [...new Set(tokenize(question))];
  if (!queryTokens.length) {
    console.log(JSON.stringify({ query: question, match: null, note: "No usable keywords after stripping stopwords." }, null, 2));
    return;
  }

  const candidates = [...memoryCandidates(), ...sectionCandidates()];
  const scored = candidates
    .map((c) => ({ ...c, score: scoreCandidate(queryTokens, c.heading, c.text) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    console.log(
      JSON.stringify(
        {
          query: question,
          keywords: queryTokens,
          match: null,
          note: "No keyword overlap in memory or root docs. Answer from general knowledge, or this may need a fresh Grep.",
        },
        null,
        2
      )
    );
    return;
  }

  const best = scored[0];
  const { text: bestText, truncated } = truncate(best.text);
  const result = {
    query: question,
    keywords: queryTokens,
    match: {
      source: best.source,
      heading: best.heading,
      ...(best.startLine ? { lines: `${best.startLine}-${best.endLine}` } : {}),
      score: best.score,
      text: bestText,
      ...(truncated ? { truncated: true } : {}),
    },
    runnerUps: scored.slice(1, 4).map((c) => ({ source: c.source, heading: c.heading, score: c.score })),
  };

  const pointer = findPointer(best.text, best.source);
  if (pointer) {
    if (pointer.type === "memory") {
      const p = join(MEMORY_DIR, `${pointer.slug}.md`);
      if (existsSync(p)) {
        const { text, truncated } = truncate(readFileSync(p, "utf8").trim());
        result.followedPointer = { source: `memory/${pointer.slug}.md`, text, ...(truncated ? { truncated: true } : {}) };
      }
    } else if (pointer.type === "doc") {
      const p = join(REPO_ROOT, pointer.file);
      if (existsSync(p)) {
        result.followedPointer = {
          source: pointer.file,
          note: "mentioned as related in the matched section - open manually if you need more than this excerpt",
          excerpt: readFileSync(p, "utf8").slice(0, 500),
        };
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
