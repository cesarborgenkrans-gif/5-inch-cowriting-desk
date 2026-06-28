/* ============================================================
   CO-WRITING - renderer
   On-demand flow: read the shared doc, send the draft below the
   divider to the selected LLM feedback mode, write the reply to
   the top of the doc, then re-render.

   Electron uses real file IPC. Browser preview uses localStorage.
   ============================================================ */
(() => {
  const MARKER = '<!-- DRAFT BELOW - the AI never edits below this line -->';
  const MARKER_RE = /<!--[\s\S]*?DRAFT BELOW[\s\S]*?-->/;
  const SEED =
`No feedback yet. Write your draft below the divider, then press the feedback button in Quill.

${MARKER}

# My draft

Type your text here.
`;

  const $ = id => document.getElementById(id);
  const statusEl = $('status');
  const setStatus = (msg, kind = '') => { statusEl.textContent = msg; statusEl.className = 'status ' + kind; };

  const DEFAULTS = { url: 'http://localhost:1234/v1', model: '', temp: 0.4, key: 'lm-studio', provider: 'lmstudio' };
  const PROVIDERS = {
    lmstudio:   { label: 'LM Studio',  url: 'http://localhost:1234/v1' },
    ollama:     { label: 'Ollama',     url: 'http://localhost:11434/v1', modelHint: 'e.g. llama3.2 (must be pulled)' },
    openrouter: { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', keyHint: 'OpenRouter API key', modelHint: 'e.g. anthropic/claude-3.7-sonnet' },
    custom:     { label: 'Custom' },
  };
  const loadSettings = () => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('cowriting-settings') || '{}') }; }
    catch { return { ...DEFAULTS }; }
  };
  let settings = loadSettings();

  const MODES = {
    tone: {
      label: 'Tone',
      sys: "You are a warm, perceptive writing companion. Give brief, concrete feedback on HOW THE TONE of the user's draft comes across to a reader: warm/cold, formal/casual, confident/tentative, sincere/ironic; who it would resonate with; and one or two gentle, specific suggestions. Do NOT rewrite or correct the text. Comment only on tone and how it lands. Under 150 words, friendly and specific."
    },
    clarity: {
      label: 'Clarity',
      sys: "You are a sharp, kind editor. Assess HOW CLEAR and easy to follow the user's draft is. Point to any sentences or passages that are confusing, ambiguous, or hard to parse, and say briefly why. Do NOT rewrite. Identify what is unclear and suggest what to clarify. Under 150 words."
    },
    audience: {
      label: 'Audience',
      sys: "You are a reader-insight analyst. Infer WHO this writing is for, say whether it would land with that reader, and flag anything that might confuse or alienate that audience. Suggest the audience it best fits. Do NOT rewrite. Under 150 words."
    },
    warmth: {
      label: 'Encourage',
      sys: "You are an encouraging writing coach. Point out specifically WHAT IS WORKING WELL in the user's draft and why it is effective, then offer ONE gentle, concrete nudge. Warm and motivating. Do NOT rewrite. Under 120 words."
    }
  };
  let mode = localStorage.getItem('cowriting-mode') || 'tone';

  const bridge = (window.cowriter && window.cowriter.isElectron) ? window.cowriter : null;
  const trimURL = u => (u || DEFAULTS.url).replace(/\/+$/, '');

  const doc = {
    read: () => bridge ? bridge.readDoc() : Promise.resolve({ ok: true, content: localStorage.getItem('cowriting-mockdoc') || SEED }),
    write: c => bridge ? bridge.writeDoc(c) : (localStorage.setItem('cowriting-mockdoc', c), Promise.resolve({ ok: true })),
    path: () => bridge ? bridge.docPath() : Promise.resolve('(browser preview - mock doc in localStorage; run via Electron for co-writing.md)')
  };

  async function llmChat(system, user) {
    const o = { baseURL: settings.url, apiKey: settings.key, model: settings.model, temperature: Number(settings.temp), system, user };
    if (bridge) return bridge.llmChat(o);
    try {
      const res = await fetch(`${trimURL(settings.url)}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model || 'local-model',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature: Number(settings.temp),
          stream: false
        })
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const d = await res.json();
      return { ok: true, text: d?.choices?.[0]?.message?.content ?? '' };
    } catch (e) {
      return { ok: false, error: `${e.message} (browser preview may be blocked by CORS; run via Electron if so)` };
    }
  }

  async function llmModels() {
    if (bridge) return bridge.llmModels({ baseURL: settings.url, apiKey: settings.key });
    try {
      const res = await fetch(`${trimURL(settings.url)}/models`);
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const d = await res.json();
      return { ok: true, models: (d?.data || []).map(m => m.id) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function checkConnection() {
    const el = $('conn');
    el.className = 'conn checking';
    el.textContent = 'checking...';
    el.title = '';
    const r = await llmModels();
    const prov = (PROVIDERS[settings.provider] || {}).label || 'LLM';
    if (r.ok) {
      const m = r.models[0] || 'model loaded';
      el.className = 'conn ok';
      el.textContent = `${prov} - ${m}`;
      el.title = (r.models || []).join(', ');
    } else {
      el.className = 'conn off';
      el.textContent = 'not reachable';
      el.title = r.error || '';
    }
  }

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const mdLite = t => '<p>' + esc(t.trim())
    .replace(/^### (.*)$/gm, '</p><h3>$1</h3><p>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^---\s*$/gm, '</p><hr><p>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>') + '</p>';
  const stripComments = s => s.replace(/<!--[\s\S]*?-->/g, '').trim();

  function splitDoc(content) {
    const exact = content.indexOf(MARKER);
    if (exact !== -1) return { ai: content.slice(0, exact), human: content.slice(exact + MARKER.length), hasMarker: true };
    const match = content.match(MARKER_RE);
    if (!match || match.index == null) return { ai: '', human: content, hasMarker: false };
    return { ai: content.slice(0, match.index), human: content.slice(match.index + match[0].length), hasMarker: true };
  }

  async function renderDoc() {
    const r = await doc.read();
    if (!r.ok) { setStatus('Could not read the doc: ' + r.error, 'err'); return; }
    const { ai, human } = splitDoc(r.content);
    const aiClean = stripComments(ai);
    const draftLines = stripComments(human).split('\n');
    const draftPreview = draftLines.slice(0, 12).join('\n') + (draftLines.length > 12 ? '\n...' : '');
    $('doc-view').innerHTML =
      `<div class="ai-zone">${aiClean ? mdLite(aiClean) : '<p class="muted">No feedback yet.</p>'}</div>` +
      `<div class="draft-preview"><span class="tag">YOUR DRAFT - edit below the divider in co-writing.md</span>${esc(draftPreview) || '(empty)'}</div>`;
    $('doc-view').scrollTop = 0;
  }

  async function getFeedback() {
    const r = await doc.read();
    if (!r.ok) { setStatus('Read failed: ' + r.error, 'err'); return; }
    const { ai, human, hasMarker } = splitDoc(r.content);
    const draft = stripComments(human).trim();
    if (draft.length < 4) { setStatus('Write your draft below the divider in co-writing.md first.', 'err'); return; }

    const m = MODES[mode];
    setStatus(`Asking the model for ${m.label.toLowerCase()} feedback...`);
    $('btn-feedback').disabled = true;
    const resp = await llmChat(m.sys, draft);
    $('btn-feedback').disabled = false;
    if (!resp.ok) { setStatus('LLM error: ' + resp.error, 'err'); return; }

    const block = `### ${m.label} feedback - ${new Date().toLocaleString()}\n\n${resp.text.trim()}\n\n---\n\n`;
    const rebuilt = block + ai + (hasMarker ? MARKER : '\n' + MARKER + '\n') + human;
    const w = await doc.write(rebuilt);
    if (!w.ok) { setStatus('Write failed: ' + w.error, 'err'); return; }
    await renderDoc();
    setStatus(
      bridge ? `${m.label} feedback written to co-writing.md` : `${m.label} feedback added to the browser mock, not co-writing.md`,
      bridge ? 'ok' : 'err'
    );
  }

  function applySettingsToFields() {
    $('cfg-provider').value = settings.provider || 'lmstudio';
    $('cfg-url').value = settings.url;
    $('cfg-model').value = settings.model;
    $('cfg-temp').value = settings.temp;
    $('cfg-key').value = settings.key;
  }

  function setActiveModeChip() {
    document.querySelectorAll('#modes .chip').forEach(c => c.classList.toggle('active', c.dataset.mode === mode));
  }

  function updateFeedbackButton() {
    $('btn-feedback').textContent = `Get ${MODES[mode].label.toLowerCase()} feedback`;
  }

  $('gear').addEventListener('click', () => { $('settings').hidden = !$('settings').hidden; });
  $('cfg-provider').addEventListener('change', e => {
    const p = PROVIDERS[e.target.value] || {};
    if (p.url) $('cfg-url').value = p.url;
    $('cfg-key').placeholder = p.keyHint || 'lm-studio';
    $('cfg-model').placeholder = p.modelHint || 'uses the loaded model';
  });
  $('cfg-save').addEventListener('click', () => {
    settings = {
      provider: $('cfg-provider').value,
      url: $('cfg-url').value.trim() || DEFAULTS.url,
      model: $('cfg-model').value.trim(),
      temp: $('cfg-temp').value || 0.4,
      key: $('cfg-key').value.trim() || 'lm-studio'
    };
    localStorage.setItem('cowriting-settings', JSON.stringify(settings));
    $('cfg-status').textContent = 'Saved';
    setTimeout(() => { $('cfg-status').textContent = ''; }, 1500);
    checkConnection();
  });
  $('btn-feedback').addEventListener('click', getFeedback);
  $('btn-refresh').addEventListener('click', () => { renderDoc(); checkConnection(); setStatus('Re-read the doc.', 'ok'); });
  $('btn-opendoc').addEventListener('click', async () => {
    if (!bridge) { setStatus('Open doc only works in the Electron app; the browser uses a mock.', 'err'); return; }
    const r = await bridge.openDoc();
    if (r && !r.ok) setStatus('Could not open co-writing.md: ' + r.error, 'err');
    else setStatus('Opened co-writing.md in your editor.', 'ok');
  });
  $('btn-openfolder').addEventListener('click', async () => {
    if (!bridge) { setStatus('Open folder only works in the Electron app.', 'err'); return; }
    const r = await bridge.openFolder();
    if (r && !r.ok) setStatus('Could not open the folder: ' + r.error, 'err');
    else setStatus('Opened the app folder.', 'ok');
  });
  document.querySelectorAll('.credit-link').forEach(a => a.addEventListener('click', () => {
    const url = a.dataset.url;
    if (!url) return;
    if (bridge) bridge.openURL(url); else window.open(url, '_blank', 'noopener');
  }));
  document.querySelectorAll('#modes .chip').forEach(c => c.addEventListener('click', () => {
    mode = c.dataset.mode;
    localStorage.setItem('cowriting-mode', mode);
    setActiveModeChip();
    updateFeedbackButton();
  }));

  const themeToggle = $('theme-toggle');
  function applyTheme(t) {
    document.body.classList.toggle('light', t === 'light');
    themeToggle.textContent = t === 'light' ? 'Dark' : 'Light';
  }
  let theme = localStorage.getItem('cowriting-theme') || 'dark';
  applyTheme(theme);
  themeToggle.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cowriting-theme', theme);
    applyTheme(theme);
  });

  applySettingsToFields();
  setActiveModeChip();
  updateFeedbackButton();
  doc.path().then(p => { $('doc-path').textContent = p; });
  renderDoc();
  checkConnection();
  if (bridge) {
    $('filebanner').hidden = true;
    setStatus('Ready. Pick a mode, write below the divider in co-writing.md, then get feedback.');
  } else {
    $('filebanner').hidden = false;
    $('filebanner').innerHTML = '<b>Browser preview - not connected to your file.</b> This reads and writes a temporary mock, not <code>co-writing.md</code>. Launch via <b>Electron</b> (<code>npm start</code>) to use the real file.';
    setStatus('Browser preview - mock doc. Run via Electron to use the real co-writing.md.', 'err');
  }
})();
