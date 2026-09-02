---
name: markitdown
description: Convert HTML, ZIP archives, YouTube URLs, EPubs, Outlook .msg files, or images/audio (via OCR/transcription) into Markdown for reading or analysis, using Microsoft's markitdown CLI. Use when the user wants to read, extract, or summarize content from one of those formats and it isn't already a PDF/Word/PowerPoint/Excel file. For PDF, DOCX, PPTX, or XLSX specifically, prefer the dedicated pdf/docx/pptx/xlsx skills instead — those support structured editing, not just this skill's plain read-only conversion.
---

# MarkItDown

Thin wrapper around [microsoft/markitdown](https://github.com/microsoft/markitdown) (MIT), a Python CLI that converts many file types to Markdown for LLM consumption. Read-only conversion — it dumps structure (headings, lists, tables, links) as Markdown, it does not edit or produce the original format back.

## When to use this vs. the dedicated format skills

This repo already has `pdf`, `docx`, `pptx`, and `xlsx` skills — those are more capable for those four formats (they can create and edit, not just read). Reach for markitdown instead when the input is one of:

- **HTML** — a saved page or fetched markup
- **ZIP** — iterates over the archive's contents, converting each
- **YouTube URL** — pulls the video transcript
- **EPub**
- **Outlook `.msg`**
- **Images** — EXIF metadata + OCR text extraction
- **Audio** (`.wav`, `.mp3`) — EXIF metadata + speech transcription
- **CSV / JSON / XML** — plain text-based formats

## Setup

Not installed by default. Before first use in a session:

```bash
pip install 'markitdown[all]'
```

Or scope it to just what's needed (faster, fewer deps):

```bash
pip install 'markitdown[pdf,docx,pptx,audio-transcription,youtube-transcription]'
```

## Usage

```bash
markitdown path-to-file.html > output.md
markitdown path-to-file.html -o output.md   # equivalent, explicit output
cat path-to-file.html | markitdown          # via stdin
```

For a YouTube URL, pass the URL directly as the path argument (requires the `youtube-transcription` extra).

## Security note

Per upstream: markitdown runs with the privileges of the current process — same caution as `open()` or `requests.get()`. Don't feed it untrusted file paths or URLs without knowing what they point to. Call the narrowest conversion needed rather than a blanket "convert everything in this ZIP" pass over content you haven't vetted.

## Also available: an MCP server

Microsoft also ships `markitdown-mcp` (`pip install markitdown-mcp`), a local STDIO/HTTP MCP server exposing one tool, `convert_to_markdown(uri)`. Not set up here — the plain CLI above covers one-off conversions without running a background service. Only worth setting up as an MCP server if this skill is invoked often enough that the per-call CLI startup cost becomes annoying.
