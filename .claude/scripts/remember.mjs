#!/usr/bin/env node
// Atomic memory save: writes the memory file AND appends its MEMORY.md index
// line in one step, so the catalogue can never drift from reality.
//
// Usage:
//   node remember.mjs --name kebab-slug --title "Index title" --type project \
//     --hook "one-line index summary" --content "body text"
//   (or pipe a longer body via stdin instead of --content)

import { writeFileSync, appendFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const MEMORY_DIR = join(homedir(), ".claude", "projects", "d--Work-Website", "memory");
const INDEX_PATH = join(MEMORY_DIR, "MEMORY.md");
const VALID_TYPES = ["user", "feedback", "project", "reference"];

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function usage(msg) {
  if (msg) console.error(msg + "\n");
  console.error(
    'Usage: node remember.mjs --name <kebab-slug> --title "<Index title>" --type <user|feedback|project|reference> --hook "<one-line index summary>" [--description "<frontmatter description>"] --content "<body>"\n(or pipe the body via stdin instead of --content)'
  );
  process.exit(1);
}

const name = arg("--name");
const title = arg("--title");
const type = arg("--type");
const hook = arg("--hook");
const description = arg("--description") || hook;
let content = arg("--content");
if (content === undefined) content = readStdin();

if (!name) usage("Missing --name");
if (!title) usage("Missing --title");
if (!type) usage("Missing --type");
if (!hook) usage("Missing --hook");
if (!content || !content.trim()) usage("Missing memory body (--content or stdin)");
if (!VALID_TYPES.includes(type)) usage(`--type must be one of: ${VALID_TYPES.join(", ")}`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) usage("--name must be kebab-case (lowercase letters, digits, hyphens)");

const filePath = join(MEMORY_DIR, `${name}.md`);
if (existsSync(filePath)) {
  console.error(`memory/${name}.md already exists — edit it directly instead of overwriting via remember.mjs`);
  process.exit(1);
}

const fileBody = `---
name: ${name}
description: ${description}
metadata:
  type: ${type}
---

${content.trim()}
`;

writeFileSync(filePath, fileBody, "utf8");

const indexLine = `- [${title}](${name}.md) — ${hook}\n`;
const currentIndex = existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH, "utf8") : "";
if (currentIndex.includes(`(${name}.md)`)) {
  console.error(`Warning: MEMORY.md already references ${name}.md — check for a duplicate entry.`);
}
appendFileSync(INDEX_PATH, indexLine, "utf8");

const lineCount = (currentIndex + indexLine).split("\n").filter(Boolean).length;
const result = {
  written: `memory/${name}.md`,
  indexUpdated: "MEMORY.md",
  indexLineCount: lineCount,
};
if (lineCount > 150) {
  result.warning = "MEMORY.md is approaching the ~200-line auto-load window — consider consolidating older entries.";
}
console.log(JSON.stringify(result, null, 2));
