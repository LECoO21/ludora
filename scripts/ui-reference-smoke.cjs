/* Isolated visual + interaction smoke. All project/account data below is a fixture.
 * Run after build: env -u ELECTRON_RUN_AS_NODE electron scripts/ui-reference-smoke.cjs
 * --baseline captures the previous renderer build at identical desktop dimensions.
 */
const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const { mkdir, readFile, writeFile, mkdtemp, rm } = require('node:fs/promises');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { createServer } = require('node:http');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
const output = join(root, '.ludora-smoke', baseline ? 'reference-before' : 'reference-after');
const now = new Date().toISOString();
let win, server, isolatedUserData;
const errors = [], calls = [], reports = [];
// Deliberately emulate a legacy light preference; the renderer must stay dark.
const settings = { theme: 'light', defaultWorkspace: '/example/games', defaultModel: 'codex-fixture', defaultEffort: 'medium' };
const runtime = { state: 'ready', binaryPath: '/example/codex', codexHome: '/example/codex-home', version: 'UI fixture',
  account: { type: 'chatgpt', email: 'creator@example.test', planType: 'UI fixture' }, error: null,
  models: [{ id: 'codex-fixture', model: 'codex-fixture', displayName: 'Codex（演示模型）', description: '仅用于离线界面验收', isDefault: true, defaultEffort: 'medium', efforts: ['low', 'medium', 'high'] }],
  capabilities: { namespaceTools: true, imageGeneration: true, externalImageGeneration: false, webSearch: true } };
let projects = ['星屿冒险', '银铲铲', '太空巡航'].map((name, i) => ({
  id: 'fixture-' + i, name, idea: i ? '制作一个有策略感的游戏，设计清晰的规则和反馈。' : '制作一个横版冒险游戏，在浮空岛之间跳跃，收集星星并找到终点。',
  root: '/example/games/' + name, createdAt: now, updatedAt: now, status: i ? 'draft' : 'stopped',
  stage: i ? 'brief' : 'code', targetFrameRate: 60, model: null, threadId: i ? null : 'fixture-thread', toolsetVersion: 1, activeTurnId: null, lastError: null,
}));
const events = [
  ['user', '你的创意', '我想做一个在浮空岛上冒险的小游戏。', 'brief'],
  ['plan', '玩法计划已整理', '先完成移动、跳跃、收集与通关，再逐步补充关卡细节。', 'gdd'],
  ['assistant', '正在搭建游戏世界', '已连接输入与场景，下一步增加碰撞检测与收集反馈。', 'code'],
  ['file', '已更新场景文件', 'src/game.js', 'code'],
  ['assistant', '这一轮已暂停', '可以继续描述想调整的内容，或查看左侧游戏预览。', 'verify'],
].map(([kind, title, message, stage], i) => ({ id: 'event-' + i, projectId: 'fixture-0', kind, title, message, stage, timestamp: now }));
const extensions = {
  mediaProviders: [],
  skills: [{ id: 'game-builder', name: '游戏制作', description: '规划玩法、搭建场景并检查结果。', source: 'built-in', path: null, enabled: true }],
  mcpServers: [{ id: 'local-assets', transport: 'stdio', command: 'example-assets', args: [], url: null, enabled: false, bearerTokenEnvVar: null, status: 'stopped', statusMessage: null }],
  promptTemplates: ['planner', 'implementer', 'reviewer', 'repair'].map((id, i) => ({ id, name: ['规划师', '开发者', '检查员', '修复'][i], description: '离线验收用模板', content: '# 制作要求\n\n让玩家能清楚理解规则，逐步完成一个可以游玩的游戏。', enabled: true, customized: false })),
};
let previewOrigin;
const asset = { id: 'asset-fixture', name: '游戏世界', kind: 'image', relativePath: 'public/assets/world.webp', mimeType: 'image/webp', size: 109914, sha256: 'fixture', source: 'imported', createdAt: now };
const api = {
  bootstrap: () => ({ projects, settings, runtime, events: { 'fixture-0': events } }),
  refreshRuntime: () => runtime,
  getExtensionSettings: () => extensions,
  listSkills: () => extensions.skills, listMcpServers: () => extensions.mcpServers, listPromptTemplates: () => extensions.promptTemplates,
  inspectProject: () => ({ previewUrl: previewOrigin, assets: [asset], files: [{ name: 'index.html', relativePath: 'index.html', type: 'file', size: 123 }],
    imageGenerationGate: { state: 'missing', relativePaths: [] } }),
  readProjectFile: () => ({ relativePath: 'index.html', content: '<!doctype html>\n<title>UI fixture</title>', binary: false, truncated: false }),
  chooseDirectory: () => '/example/games',
  saveSettings: patch => Object.assign(settings, patch),
  createProject: input => { const project = { ...projects[1], ...input, id: 'fixture-created', status: 'draft' }; projects.push(project); return project; },
  runProject: input => { const project = projects.find(p => p.id === input.projectId); project.status = 'running'; return project; },
  stopProject: id => { const project = projects.find(p => p.id === id); project.status = 'stopped'; return project; },
  resolveApproval: token => win.webContents.send('onApprovalClosed', token),
};
const evaluate = script => win.webContents.executeJavaScript(script, true);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(expression) {
  for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await pause(75); }
  throw new Error('Timed out: ' + expression);
}
async function click(selector, text) {
  const ok = await evaluate(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(el => ${text ? `el.textContent.includes(${JSON.stringify(text)})` : 'true'}); if (!el || el.disabled) return false; el.click(); return true; })()`);
  assert(ok, 'Missing/enabled control: ' + selector + ' ' + (text ?? ''));
  await pause(140);
}
async function capture(name) {
  await pause(250);
  await writeFile(join(output, name + '.png'), (await win.capturePage()).toPNG());
  const geometry = await evaluate(`(() => {
    const rect = s => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height} : null; };
    const controls = [...document.querySelectorAll('button')].slice(0, 6).map(el => {
      const s = getComputedStyle(el); return {name: el.className, bg: s.backgroundColor, color: s.color, appearance: s.appearance, panel: s.getPropertyValue('--panel')};
    });
    return { width: innerWidth, height: innerHeight, shell: rect('.app-shell'), preview: rect('.inspector'), gameFrame: rect('.preview-viewport iframe'), conversation: rect('.production-center'), bodyOverflow: document.documentElement.scrollWidth > innerWidth, theme: document.documentElement.dataset.theme, controls };
  })()`);
  assert(!geometry.bodyOverflow, name + ' document overflow');
  if (!baseline) assert.equal(geometry.theme, 'dark', name + ' must use dark theme');
  reports.push({ name, ...geometry });
}
async function checkAdvancedSettings(name) {
  const layout = await evaluate(`(() => {
    const field = document.querySelector('.composer .frame-rate-control');
    const labels = [...field.querySelectorAll('.frame-rate-options label')];
    const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width }; };
    return {
      options: labels.map(label => ({ ...rect(label), textFits: [...label.querySelectorAll('strong, span')].every(child => {
        const a = child.getBoundingClientRect(), b = label.getBoundingClientRect();
        return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
      }) })),
      field: rect(field),
      actionVisible: document.querySelector('.composer > button').getBoundingClientRect().bottom <= document.querySelector('.composer').getBoundingClientRect().bottom,
      fieldsFit: [...document.querySelectorAll('.composer-advanced-content > *')].every(el => el.scrollWidth <= el.clientWidth + 1),
    };
  })()`);
  assert.equal(layout.options.length, 3, name + ': three FPS options');
  layout.options.forEach((option, i) => {
    assert(option.width >= 55 && option.textFits, name + ': FPS text fits its card ' + i);
    assert(option.left >= layout.field.left && option.right <= layout.field.right, name + ': FPS card inside field');
    if (i) assert(option.left >= layout.options[i - 1].right + 3, name + ': FPS cards do not overlap');
  });
  assert(layout.fieldsFit, name + ': no advanced field overflow');
  assert(layout.actionVisible, name + ': primary action stays visible');
  await capture(name);
  reports.at(-1).advancedSettings = layout;
}
async function checkExpandedPipeline(name) {
  await click('.pipeline-toggle');
  assert(await evaluate(`(() => {
    const pipeline = document.querySelector('.pipeline');
    const grid = pipeline.querySelector('.stage-steps');
    const cards = [...grid.children];
    const stream = pipeline.closest('.event-stream').getBoundingClientRect();
    const bounds = pipeline.getBoundingClientRect();
    return pipeline.open && cards.length === 8
      && getComputedStyle(grid).gridTemplateColumns.split(' ').length === 4
      && grid.scrollWidth <= grid.clientWidth + 1
      && cards.every(card => [...card.querySelectorAll('strong, small')].every(text => text.scrollWidth <= text.clientWidth + 1))
      && (bounds.height > stream.height || bounds.bottom <= stream.bottom + 1)
      && pipeline.querySelector('.pipeline-title').textContent.includes('制作流程')
      && pipeline.querySelectorAll('[aria-current="step"]').length === 1
      && pipeline.querySelector('[aria-current="step"] strong').textContent === pipeline.querySelector('.pipeline-current').textContent;
  })()`), name + ': expanded four-column flow fits, current step marked, scrolled into view');
  await capture(name);
}
async function main() {
  isolatedUserData = await mkdtemp(join(tmpdir(), 'ludora-ui-reference-'));
  app.setPath('userData', isolatedUserData);
  await app.whenReady();
  nativeTheme.themeSource = 'light'; // OS light preference must not enable a light renderer.
  await mkdir(output, { recursive: true });
  const poster = await readFile(join(root, 'assets/ludora-wait-poster.webp'));
  server = createServer((request, response) => {
    if (request.url?.includes('.webp')) { response.writeHead(200, { 'Content-Type': 'image/webp' }); response.end(poster); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html lang="zh"><style>*{box-sizing:border-box}body{margin:0;background:#101624;height:100vh;position:relative;font-family:system-ui;color:white;overflow:hidden}img{width:100%;height:100%;object-fit:cover}section{position:absolute;inset:0;background:linear-gradient(transparent,#080e25b0);display:flex;flex-direction:column;justify-content:flex-end;padding:28px}small{font-size:12px;letter-spacing:1px}h1{font-size:26px;margin:6px 0}p{font-size:12px;margin:0;color:#cbd5ea}</style><img alt="" src="/assets/world.webp"><section><small>LUDORA · 静态等待画面</small><h1>让灵感成为可玩的世界</h1><p>示例画面，仅用于界面验收</p></section></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  previewOrigin = 'http://127.0.0.1:' + server.address().port;
  ipcMain.handle('ui-fixture', (_event, name, args) => {
    calls.push(name); if (!api[name]) throw new Error('Unimplemented fixture API: ' + name);
    return api[name](...args);
  });
  win = new BrowserWindow({ width: 1510, height: 940, useContentSize: true, show: false,
    webPreferences: { preload: join(__dirname, 'ui-reference-preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  win.webContents.on('console-message', (_event, level, message) => { if (level === 3) errors.push(message); });
  await win.loadFile(join(root, 'dist/renderer/index.html'));
  await waitFor("Boolean(document.querySelector('.home-composer'))");
  await capture('home-desktop');
  await click('.project-item', '星屿冒险');
  await waitFor("Boolean(document.querySelector('iframe'))");
  await capture('workspace-desktop');
  if (baseline) return;
  const positions = reports.at(-1);
  assert(positions.preview.x < positions.conversation.x, 'Preview must be left of conversation');
  assert(positions.conversation.w >= 300 && positions.conversation.w <= 360, 'Conversation width');
  assert(await evaluate("!document.querySelector('.preview-asset-shelf')"), 'Preview has no asset shelf');
  assert(await evaluate("!document.querySelector('.production-main .pipeline') && Boolean(document.querySelector('.event-stream .pipeline'))"), 'Pipeline belongs inside conversation history');
  assert(positions.gameFrame.h > 600, 'Preview uses the released vertical space');
  assert.equal(positions.shell.x, 0, 'No outer colored frame');
  assert.equal(positions.shell.w, positions.width, 'Shell spans full window');
  assert(await evaluate("getComputedStyle(document.body).backgroundImage === 'none'"), 'No outer purple gradient');
  assert(await evaluate("getComputedStyle(document.querySelector('.event-rail .game-glyph')).backgroundSize.startsWith('400%')"), 'Avatar atlas cropping');
  assert(await evaluate(`(() => {
    const pipeline = document.querySelector('.event-stream .pipeline');
    return pipeline.getBoundingClientRect().height <= 44
      && pipeline.querySelector('summary').textContent.replace(/\\s+/g, ' ').trim() === '代码实现6 / 8'
      && pipeline.querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '6'
      && !pipeline.open;
  })()`), 'Pipeline defaults to a compact, collapsed stage/count row');
  const productionCalls = () => calls.filter(name => ['runProject', 'stopProject', 'createProject'].includes(name)).length;
  const callsBeforeToggle = productionCalls();
  await checkExpandedPipeline('pipeline-expanded');
  assert(await evaluate("document.querySelectorAll('.stage-steps .is-done').length === 5"), 'Earlier stages shown as done');
  await click('.pipeline-toggle');
  assert(await evaluate("!document.querySelector('.pipeline').open && document.querySelector('.pipeline').getBoundingClientRect().height <= 44"), 'Second click restores compact row');
  await evaluate("document.querySelector('.pipeline-toggle').focus()");
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' });
  win.webContents.sendInputEvent({ type: 'char', keyCode: '\r' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' });
  await waitFor("document.querySelector('.pipeline').open");
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
  await waitFor("!document.querySelector('.pipeline').open");
  assert.equal(productionCalls(), callsBeforeToggle, 'Toggling never starts or stops production');
  await click('.pipeline-toggle');
  await click('.project-item', '银铲铲');
  await waitFor("document.querySelector('.pipeline-current').textContent === '需求拆解'");
  assert(await evaluate("!document.querySelector('.pipeline').open"), 'Switching projects resets to collapsed');
  await click('.project-item', '星屿冒险');
  await waitFor("document.querySelector('.pipeline-current').textContent === '代码实现'");
  assert(await evaluate("!document.querySelector('.pipeline').open"), 'Returning to a project starts collapsed');
  await click('[aria-label="收起项目栏"]');
  await waitFor("document.querySelector('.project-rail').getBoundingClientRect().width <= 65");
  await capture('workspace-collapsed');
  await click('[aria-label="展开项目栏"]');
  await click('[role="tab"]', '素材');
  await waitFor("Boolean(document.querySelector('.asset-card'))");
  await capture('assets');
  await click('[role="tab"]', '文件');
  await click('.file-node', 'index.html');
  await waitFor("document.querySelector('.code-viewer')?.textContent.includes('UI fixture')");
  await capture('files');
  await evaluate("document.querySelector('#inspector-tab-files').focus()");
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Left' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Left' });
  await waitFor("document.querySelector('#inspector-tab-assets')?.getAttribute('aria-selected') === 'true'");
  await click('[role="tab"]', '预览');
  await click('.event-stream-toolbar button');
  assert(await evaluate("document.querySelector('.event-stream-toolbar').textContent.includes('隐藏详细日志')"));
  await click('.event-stream-toolbar button');
  await click('.composer-advanced summary');
  await checkAdvancedSettings('composer-advanced');
  await click('.composer .frame-rate-options label', '120');
  assert(await evaluate("document.querySelector('.composer input[value=\"120\"]').checked"), 'FPS selection works');
  await evaluate("document.querySelector('.composer input[value=\"120\"]').focus()");
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Left' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Left' });
  await waitFor("document.querySelector('.composer input[value=\"60\"]').checked");
  await click('.composer-advanced summary');
  await click('[aria-label="打开设置"]');
  await waitFor("Boolean(document.querySelector('.settings-modal'))");
  for (const label of ['Codex 账户', '媒体 API', '项目默认值', 'Skills', 'MCP Servers', '提示词']) {
    await click('.settings-nav button', label);
    await capture('settings-' + label.replaceAll(' ', '-').replaceAll('/', '-'));
  }
  assert(await evaluate("!document.querySelector('.settings-modal').textContent.includes('浅色') && !document.querySelector('.theme-choices')"), 'Theme choice removed');
  // Close restores keyboard focus.
  await click('.modal-header [aria-label="关闭"]');
  await click('.topbar-more summary');
  await evaluate("document.querySelector('.conversation-heading').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))");
  assert(await evaluate("!document.querySelector('.topbar-more').open"), 'Outside pointer closes more menu');
  await click('.topbar-more summary');
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await waitFor("!document.querySelector('.topbar-more').open");
  await click('.topbar-more summary');
  assert(await evaluate("!document.querySelector('.topbar-menu').textContent.includes('浅色')"), 'No theme toggle in more menu');
  await click('.topbar-menu button', '高级创建项目');
  assert(await evaluate("!document.querySelector('.topbar-more').open"), 'Action must close more menu');
  await capture('new-project');
  await click('.modal-header [aria-label="关闭"]');
  // Native Tab must be trapped inside the dialog and restored on close.
  await click('[aria-label="打开设置"]');
  for (let i = 0; i < 35; i++) {
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' });
  }
  assert(await evaluate("Boolean(document.activeElement?.closest('[role=dialog]'))"), 'Dialog focus trap');
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await waitFor("!document.querySelector('[role=dialog]')");
  for (const [width, height] of [[1160,820], [760,620], [390,844]]) {
    win.setContentSize(width,height);
    await capture('workspace-' + width);
    await checkExpandedPipeline('pipeline-expanded-' + width);
    await click('.pipeline-toggle');
    await click('.composer-advanced summary');
    await checkAdvancedSettings('composer-advanced-' + width);
    await click('.composer-advanced summary');
    await click('.topbar-brand');
    await capture('home-' + width);
    if (width === 390) {
      await click('[aria-label="打开项目导航"]');
      await waitFor("Math.abs(document.querySelector('.project-rail').getBoundingClientRect().x) < 1");
      await capture('mobile-project-navigation');
      await click('.rail-close');
      assert(await evaluate("!document.querySelector('.project-rail').classList.contains('is-open')"), 'Mobile drawer closes');
    }
    await click('[aria-label="打开设置"]');
    await click('.settings-nav button', '媒体 API');
    await capture('settings-' + width);
    await click('.modal-header [aria-label="关闭"]');
    await click('.workspace-switch button', '游戏工作台');
  }
  win.setContentSize(1510,940);
  await click('.run-button');
  await waitFor("Boolean(document.querySelector('.stop-button'))");
  await click('.stop-button');
  await waitFor("Boolean(document.querySelector('.run-button'))");
  assert(calls.includes('runProject') && calls.includes('stopProject'), 'Run/stop callbacks');
  await click('.pipeline-toggle');
  win.webContents.send('onProjectChanged', { ...projects[0], stage: 'verify', status: 'running' });
  await waitFor("document.querySelector('.pipeline-track')?.getAttribute('aria-valuenow') === '7'");
  assert(await evaluate("document.querySelector('.pipeline').open && document.querySelector('[aria-current=step] strong').textContent === '构建验证'"), 'Stage updates preserve expanded state and update current card');
  win.webContents.send('onProjectChanged', { ...projects[0], stage: 'complete', status: 'completed' });
  await waitFor("document.querySelector('.pipeline-track')?.getAttribute('aria-valuenow') === '8'");
  assert(await evaluate("document.querySelector('.pipeline-current').textContent === '完成交付' && document.querySelector('.pipeline-count').textContent === '8 / 8'"), 'Completed stage and total count');
  assert(await evaluate("document.querySelector('.pipeline').open && document.querySelectorAll('.stage-steps .is-done').length === 8 && !document.querySelector('[aria-current=step]')"), 'Completed flow stays expanded with all eight stages done');
  await capture('pipeline-completed-expanded');
  await click('.pipeline-toggle');
  await capture('pipeline-completed');
  win.webContents.send('onProjectChanged', projects[0]);
  win.webContents.send('onApproval', { token: 'fixture-approval', projectId: 'fixture-0', kind: 'command', method: 'command', title: '构建游戏', summary: '运行本地构建并检查结果', details: { command: 'npm run build' }, createdAt: now });
  await waitFor("Boolean(document.querySelector('.approval-modal'))");
  await capture('approval');
  await click('.approval-actions button', '拒绝');
  await waitFor("!document.querySelector('.approval-modal')");
  await click('.topbar-brand');
  await click('.home-example-row button');
  await click('.home-start-button');
  await waitFor("Boolean(document.querySelector('.stop-button'))");
  assert(calls.includes('createProject'), 'Homepage creates a project before starting');
  assert(await evaluate("document.querySelector('.pipeline-track')?.getAttribute('aria-valuenow') === '1' && document.querySelector('.pipeline-current').textContent === '需求拆解' && !document.querySelector('.pipeline').open"), 'New project starts at step one with a collapsed flow');
  await capture('home-created-project');
  await click('.stop-button');
  assert.equal(errors.length, 0, errors.join('\n'));
}
main().then(async () => {
  await writeFile(join(output, 'report.json'), JSON.stringify({ fixture: true, reports, calls, errors }, null, 2));
  console.log('PASS: ' + reports.length + ' UI captures; ' + output);
  return 0;
}).catch(error => { console.error(error); return 1; }).then(async (exitCode) => {
  win?.destroy();
  server?.close();
  // Exact directory returned by mkdtemp; no user project data is removed.
  if (isolatedUserData) await rm(isolatedUserData, { recursive: true, force: true }).catch(() => {});
  app.exit(exitCode);
});
