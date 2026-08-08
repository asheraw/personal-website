---
description: Deterministic keyword-scored lookup across memory and the root docs, before reading files directly
---

Run `node .claude/scripts/recall.mjs "$ARGUMENTS"` and use its JSON output as your evidence — the matched section's text is already attached, so answer from that directly. Only fall back to `Read`/`Grep` on the source files if the script returns `"match": null` or its match clearly doesn't answer the question.
