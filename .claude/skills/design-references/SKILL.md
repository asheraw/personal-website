---
name: design-references
description: Curated index of 68+ real-brand DESIGN.md starting points (Claude, Stripe, Vercel, Apple, Linear, Notion, Tesla, and more) for scaffolding a new design system in Claude Design or bootstrapping design tokens for this site. Use when a brief names a brand/product aesthetic to emulate ("make it feel like Linear", "Stripe-y", "Apple-esque"), or when starting a new DESIGN.md/design system from scratch and a real-world reference would speed up the color/type/component decisions.
---

# Design references

Pointer skill, not a generator. Source: [VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design) (MIT), files served from [getdesign.md](https://getdesign.md/).

## What this is

A `DESIGN.md` is a single markdown file describing a brand's visual language (theme, color roles, type scale, component styling, layout, elevation, do's/don'ts, responsive behavior, agent prompt guide) in a format an AI design agent can act on directly. This collection has 68+ of them, one per known brand, as **inspiration starting points** — not official brand assets. See `references/collection.md` for the full categorized list with links and one-line style descriptions.

## When to use

- User names a brand/product as the aesthetic target ("Stripe-like landing page", "Linear-style dashboard").
- Starting a design system from zero and a concrete reference beats guessing.
- Feeds naturally into `design-taste-frontend` (dial-setting, anti-slop discipline) and `design` (Claude Design canvas) — pull a reference file first, then apply those skills' rules on top of it.

## Workflow

1. Check `references/collection.md` for a brand matching the requested aesthetic (by name or by style description).
2. Fetch the `DESIGN.md` from its `getdesign.md/<brand>/design-md` page — read it as inspiration for tokens (color roles, type scale, spacing, component states), not a template to clone verbatim.
3. Never present the output as the named brand's actual/official design system, and don't claim endorsement or affiliation — these are educational, publicly-observable-pattern approximations, not licensed brand assets.
4. If the user wants a truly original system, use the closest reference as a structural starting point (the 9 sections listed below) and swap every token.

## The 9 DESIGN.md sections

Visual Theme & Atmosphere · Color Palette & Roles · Typography Rules · Component Stylings · Layout Principles · Depth & Elevation · Do's and Don'ts · Responsive Behavior · Agent Prompt Guide.

## Caution

Brand names, logos, and proprietary typefaces belong to their respective owners. These files are not affiliated with, endorsed by, or sponsored by the named companies. Use as inspiration, flag clearly when doing so, and don't ship a 1:1 clone of a real company's identity under another name.
