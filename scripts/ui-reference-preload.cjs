// Used only by ui-reference-smoke.cjs. No host credentials or filesystem access.
const { contextBridge, ipcRenderer } = require('electron');
const methods = ['bootstrap', 'refreshRuntime', 'startLogin', 'logout', 'chooseDirectory',
  'createProject', 'runProject', 'stopProject', 'revealProject', 'importProjectAssets',
  'importDroppedProjectAssets', 'inspectProject', 'readProjectFile', 'saveSettings',
  'getExtensionSettings', 'saveMediaProvider', 'testMediaProvider', 'listSkills',
  'setSkillEnabled', 'listMcpServers', 'saveMcpServer', 'removeMcpServer',
  'listPromptTemplates', 'savePromptTemplate', 'resetPromptTemplate', 'resolveApproval'];
const events = ['onAgentEvent', 'onProjectChanged', 'onRuntimeChanged', 'onApproval', 'onApprovalClosed', 'onAssetsChanged'];
contextBridge.exposeInMainWorld('noobi', Object.fromEntries([
  ...methods.map(name => [name, (...args) => ipcRenderer.invoke('ui-fixture', name, args)]),
  ...events.map(name => [name, (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on(name, handler);
    return () => ipcRenderer.removeListener(name, handler);
  }]),
]));
