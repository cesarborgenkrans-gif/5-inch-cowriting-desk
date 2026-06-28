# Quill - Side-Screen Co-Writing Desk

```text
 /\_/\
( o.o )   QUILL
 > ^ <    a small side-screen desk for draft feedback
```

Quill is a compact Electron dashboard for a small secondary display beside your
main screen. It gives on-demand feedback on a shared Markdown document using an
OpenAI-compatible LLM. You write below the divider in `co-writing.md`; Quill
writes feedback above the divider, newest first, so the latest note stays visible
on the side screen.

Nothing auto-runs. Feedback is only requested when you press a button.

## What It Does

- **Keeps one shared writing file:** `co-writing.md` sits beside the app and is
  easy to open in your editor.
- **Protects the draft area:** the app writes feedback above the divider and
  leaves the draft below it alone.
- **Offers four feedback lenses:** Tone, Clarity, Audience, and Encourage.
- **Uses local models by default:** LM Studio is the default OpenAI-compatible
  endpoint, with Ollama, OpenRouter, and custom endpoints supported.
- **Works as a side-screen dashboard:** the full app targets a compact portrait
  display, while `npm run dev` opens a resizable development window.
- **Supports dark and light modes:** a quiet dark mode and a warm paper-like
  light mode are built in.

## Project Map

```text
co-writing-llm-electron/
  index.html              dashboard shell and controls
  renderer.js             document display, feedback modes, settings
  style.css               compact side-screen interface
  main.js                 Electron window, file write IPC, LLM proxy
  preload.js              isolated renderer bridge
  co-writing.md           clean starter writing document
  co-writing.example.md   example document shape
  package.json            Electron scripts
```

## Standalone Release Contents

Quill is designed to run from its own project folder. Keep these files with the
app when preparing a release copy:

- `main.js`, `preload.js`, `index.html`, `renderer.js`, `style.css`
- `package.json` and `package-lock.json`
- `co-writing.md` and `co-writing.example.md`
- `LICENSE`, `.gitignore`, `.gitattributes`, and `README.md`

Do not include generated local files such as `node_modules/`,
`displays-detected.json`, `.env*`, local secrets, keys, logs, or caches in a
public release bundle. Recreate dependencies with `npm install`.

## Requirements

- Node.js for Electron.
- An OpenAI-compatible chat endpoint:
  - LM Studio at `http://localhost:1234/v1`
  - Ollama at `http://localhost:11434/v1`
  - OpenRouter at `https://openrouter.ai/api/v1`
  - any compatible custom endpoint

Local LM Studio and Ollama keep drafts on your machine. OpenRouter or another
cloud endpoint receives the draft text you submit and may cost money per call.

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

`npm run dev` opens a normal resizable window.

## Setup Flow

1. Start LM Studio, Ollama, or another OpenAI-compatible provider.
2. Open Quill settings.
3. Choose provider, base URL, model, temperature, and API key if needed.
4. Open `co-writing.md` and write below the divider.
5. Pick Tone, Clarity, Audience, or Encourage.
6. Press the feedback button.

## How The File Works

`co-writing.md` is intentionally tracked as a clean starter document. During use,
Quill rewrites it by adding feedback blocks above this divider:

```markdown
<!-- DRAFT BELOW - the AI never edits below this line -->
```

Keep your draft below that line. Feedback appears above it, newest first. Commit
runtime edits to `co-writing.md` only when you intentionally want to publish that
sample text.

## Local Files And Privacy

Quill stores settings in browser local storage and writes
`displays-detected.json` when Electron detects screens. Git ignores local display
data, `.env*`, `*.local*`, secrets, keys, logs, caches, editor folders, and
`node_modules/`.

The model receives the text below the divider. Do not send private drafts to a
cloud provider unless that is intentional.

## Credits

- **Concept, design, and development:** Cesar Borgenkrans / SparkleSnap.
- **Code co-author:** Claude Opus 4.8-senpai, AI pair programmer.
- **Part of:** [SparkleSnap](https://sparklesnap.dev) and
  [github.com/cesarborgenkrans-gif](https://github.com/cesarborgenkrans-gif).

## License And Creative Reuse

Copyright (c) 2026 Cesar Borgenkrans / SparkleSnap.

The source code in this project is released under the MIT License. See
[LICENSE](LICENSE).

The MIT License applies to the code only.

SparkleSnap names, logos, visual identity, official artwork files, copy, fonts,
and other brand assets are not included in the MIT License. Please do not
present derivative work as an official SparkleSnap release, and do not reuse the
SparkleSnap identity as your own brand.

Commercial use of SparkleSnap branding needs permission first.
