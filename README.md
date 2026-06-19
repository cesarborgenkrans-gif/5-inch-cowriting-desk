# 🪶 Quill — Co-Writing Desk

A small 5-inch dashboard (Electron, 1440×2560 portrait) for **on-demand local-LLM feedback on a
shared markdown doc**. You write your draft **below** the divider in `co-writing.md`; press a
feedback button and the model's reply is written **above** the divider (newest on top), so the
latest note always has display precedence. Nothing auto-runs — feedback is button-triggered.

Four lenses: **🪶 Tone · 🔍 Clarity · 🎯 Audience · 💛 Encourage** — each comments on the draft
without rewriting it.

## Requirements
- **Node.js** (Electron app).
- **An OpenAI-compatible LLM.** Pick a **provider** in ⚙ settings (it just pre-fills the base URL):
  - **LM Studio** (local, default) — start its server, load a model.
  - **Ollama** (local) — `http://localhost:11434/v1`, model = a pulled model (e.g. `llama3.2`).
  - **OpenRouter** (cloud) — `https://openrouter.ai/api/v1` + your API key (note: cloud = your draft leaves the machine, and it costs per call).
  - **Custom** — any OpenAI-compatible endpoint.

## Run
```bash
npm install
npm start          # full-screen on the panel
npm run dev        # normal resizable window
```
Write below the divider in `co-writing.md` (the **📂 Open doc** button opens it in your editor),
pick a lens, and press the feedback button. **Esc** quits.

## How it works
- `co-writing.md` is the shared brain file (next to the app). The AI writes feedback blocks above
  the divider; you keep your draft below it.
- The model never edits your draft — it only appends feedback. Writes happen through an Electron
  IPC `write-doc` handler (the app does the file write, not the model).
- The LLM call is proxied through the main process to dodge browser CORS.

## Credits
- **Concept, design & development:** **Cesar Borgenkrans** — conceptual author and developer.
- **Part of [SparkleSnap](https://sparklesnap.dev)** · [github.com/cesarborgenkrans-gif](https://github.com/cesarborgenkrans-gif)
- **Code co-author:** **Claude Opus 4.8-senpai** 🤖

© 2026 Cesar Borgenkrans / SparkleSnap. Original concept is the author's intellectual property.

## License
The **code** is released under the **MIT License** — see [LICENSE](LICENSE). The SparkleSnap
brand and identity are **not** covered by MIT and remain © Cesar Borgenkrans.
