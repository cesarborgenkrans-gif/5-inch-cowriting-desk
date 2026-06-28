# Quill - Side-Screen Co-Writing Desk

```text
 /\_/\
( o.o )   QUILL
 > ^ <    a small side-screen desk for draft feedback
```

Quill is a compact Electron dashboard for a small secondary display beside your
main screen. It gives on-demand feedback on a shared Markdown document through
an OpenAI-compatible LLM. You write below the divider in `co-writing.md`; Quill
writes feedback above it, newest first.

Nothing auto-runs. Feedback is only requested when you press a button.

## What It Does

- **Keeps one shared writing file:** `co-writing.md` sits beside the app.
- **Protects the draft area:** Quill writes feedback above the divider and
  leaves the draft below it alone.
- **Offers four feedback lenses:** Tone, Clarity, Audience, and Encourage.
- **Supports common endpoints:** LM Studio, Ollama, OpenRouter, and custom
  OpenAI-compatible servers.
- **Fits a side screen:** `npm start` opens the compact dashboard;
  `npm run dev` opens a resizable development window.
- **Includes dark and light modes:** quiet dark mode and warm paper light mode.

## Requirements

- Node.js for Electron.
- An OpenAI-compatible chat endpoint:
  - LM Studio at `http://localhost:1234/v1`
  - Ollama at `http://localhost:11434/v1`
  - OpenRouter at `https://openrouter.ai/api/v1`
  - any compatible custom endpoint

Local LM Studio and Ollama keep drafts on your machine. A cloud endpoint
receives the draft text you submit and may cost money per call.

## Run

```bash
npm install
npm start
```

`npm start` opens the locked side-screen dashboard window. Press `Esc` to quit.

For development:

```bash
npm run dev
```

## Use

1. Start your LLM provider.
2. Open Quill settings and choose the provider, model, temperature, and API key
   if needed.
3. Write your draft below this divider in `co-writing.md`:

```markdown
<!-- DRAFT BELOW - the AI never edits below this line -->
```

4. Pick Tone, Clarity, Audience, or Encourage.
5. Press the feedback button.

Quill stores settings in browser local storage and writes
`displays-detected.json` when Electron detects screens. Git ignores display
data, `.env*`, `*.local*`, secrets, keys, logs, caches, editor folders, and
`node_modules/`.

## Files And Privacy

Keep the app source, `co-writing.md`, `co-writing.example.md`,
`package-lock.json`, `LICENSE`, and this README together for a standalone copy.

The model receives the text below the divider. Do not send private drafts to a
cloud provider unless that is intentional. Commit runtime edits to
`co-writing.md` only when you intentionally want to publish that sample text.

## Credits

- **Concept, design, and development:** Cesar Borgenkrans / SparkleSnap.
- **Code co-author:** Claude Opus 4.8-senpai, AI pair programmer.
- **Part of:** [SparkleSnap](https://sparklesnap.dev) and
  [github.com/cesarborgenkrans-gif](https://github.com/cesarborgenkrans-gif).

## License And Creative Reuse

Copyright (c) 2026 Cesar Borgenkrans / SparkleSnap.

The source code in this project is released under the MIT License. See
[LICENSE](LICENSE). The MIT License applies to the code only.

The characters and creative world around this project are meant to be adored,
shared, and remixed. Fan art, fan fiction, small remixes, and other original fan
works are welcome with friendly credit to Cesar Borgenkrans / SparkleSnap.
SparkleSnap names, logos, official artwork files, visual identity, copy, fonts,
and other brand assets remain outside the code license. Please do not present
fan works as official releases or reuse SparkleSnap as your own brand.
Commercial use of characters, official artwork, or SparkleSnap branding needs
permission first.
