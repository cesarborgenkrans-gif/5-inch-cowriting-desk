const { contextBridge, ipcRenderer } = require('electron');

// The renderer's bridge to the doc (read/write_file) and the local LLM.
contextBridge.exposeInMainWorld('cowriter', {
  isElectron: true,
  docPath: () => ipcRenderer.invoke('doc-path'),
  openDoc: () => ipcRenderer.invoke('open-doc'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readDoc: () => ipcRenderer.invoke('read-doc'),
  writeDoc: (content) => ipcRenderer.invoke('write-doc', content),
  llmChat: (opts) => ipcRenderer.invoke('llm-chat', opts),
  llmModels: (opts) => ipcRenderer.invoke('llm-models', opts),
  openURL: (url) => ipcRenderer.invoke('open-url', url)
});
