import {
  ArrowRight,
  ChevronDown,
  Clock3,
  FolderOpen,
  Gamepad2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  DEFAULT_TARGET_FRAME_RATE,
  TARGET_FRAME_RATES,
  type AppSettings,
  type ModelOption,
  type ProjectRecord,
  type RuntimeStatus,
  type TargetFrameRate,
} from '../../shared/contracts';
import { formatRelative, PROJECT_STATUS_LABELS, runtimeLabel } from '../ui';
import { GameGlyph, ProjectAvatar } from './GameGlyph';
import poster from '../../../assets/ludora-wait-poster.webp';

export interface QuickStartDraft {
  idea: string;
  name: string;
  parentDirectory: string;
  model: string | null;
  effort: string;
  targetFrameRate: TargetFrameRate;
}

interface HomeWorkspaceProps {
  projects: readonly ProjectRecord[];
  settings: AppSettings;
  runtime: RuntimeStatus;
  imageGenerationAvailable: boolean;
  busy: 'idle' | 'creating' | 'starting';
  onOpenProject: (project: ProjectRecord) => void;
  onOpenSettings: () => void;
  onChooseDirectory: () => Promise<string | null>;
  onStart: (draft: QuickStartDraft) => Promise<void>;
}

const EXAMPLES = [
  '制作一个俯视角收集游戏，收集 5 颗星星获胜。',
  '制作一个横版跳跃游戏，躲避障碍并到达终点。',
  '制作一个太空射击游戏，坚持 60 秒即可获胜。',
];

export function HomeWorkspace({
  projects,
  settings,
  runtime,
  imageGenerationAvailable,
  busy,
  onOpenProject,
  onOpenSettings,
  onChooseDirectory,
  onStart,
}: HomeWorkspaceProps) {
  const defaultModel = useMemo(
    () => settings.defaultModel ?? runtime.models.find((item) => item.isDefault)?.model ?? runtime.models[0]?.model ?? null,
    [runtime.models, settings.defaultModel],
  );
  const [draft, setDraft] = useState<QuickStartDraft>({
    idea: '',
    name: '',
    parentDirectory: settings.defaultWorkspace,
    model: defaultModel,
    effort: settings.defaultEffort,
    targetFrameRate: DEFAULT_TARGET_FRAME_RATE,
  });
  const activeModel = runtime.models.find((item) => item.model === draft.model) ?? null;
  const blocker = homeBlocker(runtime, imageGenerationAvailable);
  const working = busy !== 'idle';
  const recentProjects = projects.slice(0, 3);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      parentDirectory: current.parentDirectory || settings.defaultWorkspace,
      model: current.model ?? defaultModel,
    }));
  }, [defaultModel, settings.defaultWorkspace]);

  useEffect(() => {
    if (!activeModel || activeModel.efforts.includes(draft.effort)) return;
    setDraft((current) => ({ ...current, effort: activeModel.defaultEffort }));
  }, [activeModel, draft.effort]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (blocker) {
      onOpenSettings();
      return;
    }
    if (!draft.idea.trim() || !draft.parentDirectory.trim() || working) return;
    await onStart({ ...draft, idea: draft.idea.trim() });
  }

  async function chooseDirectory() {
    const directory = await onChooseDirectory();
    if (directory) setDraft((current) => ({ ...current, parentDirectory: directory }));
  }

  function chooseModel(model: ModelOption | null) {
    setDraft((current) => ({
      ...current,
      model: model?.model ?? null,
      effort: model?.defaultEffort ?? current.effort,
    }));
  }

  const buttonLabel = working
    ? busy === 'creating' ? '正在创建…' : '正在启动…'
    : blocker?.action ?? '开始制作';

  return (
    <section className="home-workspace">
      <div className="home-main">
      <div className="home-intro">
        <span className="home-kicker"><Gamepad2 size={15} /> AI 游戏工作台</span>
        <h1>今天想做什么游戏？</h1>
        <p>描述玩法、视角和风格，Ludora 会创建工程并开始制作。</p>
      </div>

      <form className="home-composer" onSubmit={(event) => void submit(event)}>
        <label className="sr-only" htmlFor="home-game-idea">游戏创意</label>
        <textarea
          id="home-game-idea"
          value={draft.idea}
          rows={5}
          maxLength={12_000}
          autoFocus
          disabled={working}
          placeholder="例如：制作一个俯视角收集游戏，方向键移动，收集 5 颗星星获胜……"
          onChange={(event) => setDraft((current) => ({ ...current, idea: event.target.value }))}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !working) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />

        <div className="home-example-row" aria-label="游戏创意示例">
          {EXAMPLES.map((example, index) => (
            <button
              type="button"
              key={example}
              disabled={working}
              onClick={() => setDraft((current) => ({ ...current, idea: example }))}
            >
              <GameGlyph kind={(['potion', 'castle', 'game'] as const)[index]!} />
              {['星星收集', '横版冒险', '太空射击'][index]}
            </button>
          ))}
        </div>

        <details className="home-advanced">
          <summary><Settings2 size={14} /> 高级设置 <ChevronDown size={14} /></summary>
          <div className="home-advanced-grid">
            <label>
              <span>项目名称</span>
              <input
                value={draft.name}
                maxLength={80}
                disabled={working}
                placeholder="默认根据创意生成"
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="home-path-field">
              <span>保存位置</span>
              <span className="home-path-control">
                <input
                  value={draft.parentDirectory}
                  disabled={working}
                  onChange={(event) => setDraft((current) => ({ ...current, parentDirectory: event.target.value }))}
                />
                <button type="button" disabled={working} onClick={() => void chooseDirectory()}>
                  <FolderOpen size={14} /> 选择
                </button>
              </span>
            </label>
            <label>
              <span>模型</span>
              <select
                value={activeModel?.model ?? ''}
                disabled={working || runtime.models.length === 0}
                onChange={(event) => chooseModel(runtime.models.find((item) => item.model === event.target.value) ?? null)}
              >
                {runtime.models.length === 0 ? <option value="">登录后读取模型</option> : null}
                {runtime.models.map((model) => (
                  <option key={model.id} value={model.model}>{model.displayName}</option>
                ))}
              </select>
            </label>
            <label>
              <span>推理强度</span>
              <select
                value={draft.effort}
                disabled={working || !activeModel}
                onChange={(event) => setDraft((current) => ({ ...current, effort: event.target.value }))}
              >
                {(activeModel?.efforts ?? [settings.defaultEffort]).map((effort) => (
                  <option key={effort} value={effort}>{effort.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>
              <span>目标帧率</span>
              <select
                value={draft.targetFrameRate}
                disabled={working}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  targetFrameRate: Number(event.target.value) as TargetFrameRate,
                }))}
              >
                {TARGET_FRAME_RATES.map((frameRate) => (
                  <option key={frameRate} value={frameRate}>{frameRate} FPS</option>
                ))}
              </select>
            </label>
          </div>
        </details>

        {blocker ? (
          <div className="home-status-notice" role="status">
            <span><strong>{blocker.title}</strong><small>{blocker.message}</small></span>
          </div>
        ) : null}

        <footer className="home-composer-footer">
          <span>{draft.parentDirectory.trim() ? '项目将保存在默认工作区' : '请先选择保存位置'}</span>
          <button
            className="home-start-button"
            type="submit"
            disabled={working || (!blocker && (!draft.idea.trim() || !draft.parentDirectory.trim()))}
          >
            <Sparkles size={16} /> {buttonLabel} <ArrowRight size={15} />
          </button>
        </footer>
      </form>

      <section className="recent-projects" aria-labelledby="recent-projects-title">
        <header>
          <div>
            <span>最近项目</span>
            <h2 id="recent-projects-title">继续你的游戏</h2>
          </div>
          {projects.length > 3 ? <small>共 {projects.length} 个项目</small> : null}
        </header>
        {recentProjects.length ? (
          <div className="recent-project-list">
            {recentProjects.map((project) => (
              <button type="button" key={project.id} onClick={() => onOpenProject(project)}>
                <ProjectAvatar name={project.name} />
                <span className="recent-project-copy">
                  <strong>{project.name}</strong>
                  <small>{PROJECT_STATUS_LABELS[project.status]}</small>
                </span>
                <time dateTime={project.updatedAt}><Clock3 size={12} /> {formatRelative(project.updatedAt)}</time>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          <div className="recent-project-empty">
            <Gamepad2 size={19} />
            <span><strong>还没有游戏项目</strong><small>你的第一个游戏会出现在这里。</small></span>
          </div>
        )}
      </section>
      </div>
      <aside className="home-companion" aria-label="创作指南">
        <div className="studio-art"><img src={poster} alt="Ludora 游戏世界宣传图" /><div><span>LUDORA STUDIO</span><strong>Turn ideas into<br />playable worlds.</strong></div></div>
        <section className="creation-guide">
          <header><strong>你的制作团队</strong><span>一起把想法做出来</span></header>
          <div><GameGlyph kind="planner" /><p><strong>规划师</strong><span>理解创意，拆解玩法与制作计划</span></p></div>
          <div><GameGlyph kind="developer" /><p><strong>开发者</strong><span>编写代码，搭建场景与游戏规则</span></p></div>
          <div><GameGlyph kind="reviewer" /><p><strong>检查员</strong><span>检查结果，让游戏顺利运行</span></p></div>
        </section>
        <div className="home-workspace-note"><GameGlyph kind="chest" /><p><strong>你的作品，保存在本地</strong><span>项目文件与素材随时可以继续编辑。</span></p></div>
      </aside>
    </section>
  );
}

function homeBlocker(
  runtime: RuntimeStatus,
  imageGenerationAvailable: boolean,
): { title: string; message: string; action: string } | null {
  if (runtime.state !== 'ready') {
    return {
      title: runtime.state === 'starting' ? '正在连接 Codex' : '运行环境需要检查',
      message: runtimeLabel(runtime),
      action: runtime.state === 'starting' ? '查看状态' : '检查运行环境',
    };
  }
  if (!runtime.account) {
    return {
      title: '登录后开始制作',
      message: 'Ludora 需要使用你的 Codex 账户运行游戏制作 Agent。',
      action: '登录 Codex',
    };
  }
  if (!imageGenerationAvailable) {
    return {
      title: '需要配置图片能力',
      message: '请启用 Codex ImageGen，或在设置中配置图片服务。',
      action: '配置图片能力',
    };
  }
  if (runtime.models.length === 0) {
    return {
      title: '没有可用模型',
      message: '请刷新 Codex 运行环境后重试。',
      action: '检查模型',
    };
  }
  return null;
}
