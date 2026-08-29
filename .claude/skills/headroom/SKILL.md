---
name: headroom
description: Context-compression layer for Claude Code sessions - cuts token usage on tool outputs, logs, and conversation history before they reach the model (60-95% reduction claimed on JSON, less on code/prose), with retrieval of the original if it's ever needed. Use when a session is burning through tokens fast on large tool outputs, or when the user asks about reducing token usage, context bloat, or running a "compressed" session.
---

# Headroom

Wraps a Claude Code session behind a local compression proxy. Source: [headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom) (Apache 2.0). Installed as a `uv tool` (`~/.local/bin/headroom`), not copied as a skill file - there was nothing to copy, it's a real CLI/library.

## How to use it

```bash
headroom wrap claude
```

Starts headroom's local proxy on port 8787, then launches a `claude` session routed through it. Traffic gets compressed on the way to the model; `headroom_retrieve` pulls the original back if the model ever needs it. Undo with `headroom unwrap claude` (or just start a normal `claude` session instead - wrapping is per-invocation, not permanent).

Check health any time with `headroom doctor` (confirms the proxy is reachable and routing) or `headroom perf` / `headroom dashboard` (savings so far).

## Compatibility with `model-router` / `fabsol`

This repo already has `model-router` and `fabsol`, which route specific one-off worker/subagent calls through a **different** local proxy (CLIProxyAPI, port 8317) by setting `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` on that one command only. `model-router`'s own `SKILL.md` is explicit that those variables must **never** be set on the main interactive session's environment. Headroom wraps the *main* session instead. Because of that split, normal use of each doesn't collide:

- `headroom wrap claude` for an ordinary interactive session you want compressed.
- `model-router`/`fabsol`'s per-command `ANTHROPIC_BASE_URL=...` prefix for a specific worker call routed to a different model.

**Do not combine them on the same command** - both work by pointing `ANTHROPIC_BASE_URL` somewhere, and only one destination can win. If a `model-router`-routed call is ever needed from inside a headroom-wrapped session, don't assume it'll chain through both proxies correctly; drop out of the wrap first, or test it in isolation before relying on it.

## What it also installs

Wrapping registers **Serena** (semantic code navigation) at Claude Code's user scope (`~/.claude.json`), so it stays available in other projects until `headroom unwrap` runs. To skip that, add `--code-memory none` to the wrap command.

## Not set up

- No always-on global wrap. Each session opts in with `headroom wrap claude`; ordinary `claude` still works exactly as before.
- No `headroom proxy` daemon running persistently - it starts with `wrap` and stops when that session ends.
