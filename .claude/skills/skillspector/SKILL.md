---
name: skillspector
description: Security scanner for AI agent skills - detects prompt injection, malicious patterns, data exfiltration, and supply-chain risks in Claude Code/Codex/MCP skills before installing them. Use before adding a new third-party skill, or when asked to audit/verify a skill's safety.
---

# SkillSpector

NVIDIA's scanner for Claude Code/Codex/MCP skills. Source: [NVIDIA/skillspector](https://github.com/NVIDIA/skillspector) (Apache 2.0). Installed as a `uv tool` (`~/.local/bin/skillspector`), not copied - it's a real CLI, nothing to bring in as files.

## Usage

```bash
skillspector scan .claude/skills/<name>/ --no-llm    # local directory
skillspector scan path/to/SKILL.md --no-llm           # single file
skillspector scan https://github.com/org/repo --no-llm  # a repo, before cloning it
```

Drop `--no-llm` to enable its semantic analyzers (developer-intent, quality-policy, security-discovery) if an API key is configured for it - without one they're skipped and it still runs its structural/pattern checks.

## What it catches

Real, useful in practice: flagged the `headroom` skill's external doc link as "referenced artifact not completely inspected" - an honest incomplete-coverage warning, not a false alarm. This is the same manual check ("did I actually read what this points to before trusting it") this whole skill-vetting process has been doing by hand - now automatable as a first pass before the manual read.

## When to reach for it

Run it against a new skill's directory (or its source repo URL, before cloning) as a first-pass check, before the manual safety/conflict review. It doesn't replace reading the actual SKILL.md content - it catches structural/pattern-level risk (unresolved references, embedded directives, executable scripts) that's easy to miss skimming a long file by eye.
