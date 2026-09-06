import {
  ChevronDown,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type {
  AppSettings,
  ModelOption,
  ProjectRecord,
  TargetFrameRate,
} from '../../shared/contracts';
import { AssetRequirement } from './AssetRequirement';
import { FrameRateControl } from './FrameRateControl';

interface ComposerProps {
  project: ProjectRecord;
  models: readonly ModelOption[];
  settings: AppSettings;
  imageGenerationAvailable: boolean;
  disabled?: boolean;
  onRun: (
    prompt: string,
    model: string | null,
    effort: string | null,
    targetFrameRate: TargetFrameRate,
  ) => Promise<void>;
  onStop: () => Promise<void>;
}

export function Composer({
  project,
  models,
  settings,
  imageGenerationAvailable,
  disabled = false,
  onRun,
  onStop,
}: ComposerProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(
    project.model ?? settings.defaultModel ?? models.find((item) => item.isDefault)?.model ?? '',
  );
  const activeModel = useMemo(
    () => models.find((item) => item.model === model) ?? models[0] ?? null,
    [model, models],
  );
  const [effort, setEffort] = useState(settings.defaultEffort);
  const [targetFrameRate, setTargetFrameRate] = useState<TargetFrameRate>(project.targetFrameRate);
  const running = project.status === 'running';
  const resumable = Boolean(project.threadId);

  useEffect(() => {
    setModel(
      project.model ??
        settings.defaultModel ??
        models.find((item) => item.isDefault)?.model ??
        models[0]?.model ??
        '',
    );
    setEffort(settings.defaultEffort);
    setTargetFrameRate(project.targetFrameRate);
    setPrompt('');
  }, [
    project.id,
    project.model,
    project.targetFrameRate,
    settings.defaultEffort,
    settings.defaultModel,
    models,
  ]);

  useEffect(() => {
    if (!activeModel) return;
    if (!activeModel.efforts.includes(effort)) {
      setEffort(activeModel.defaultEffort);
    }
  }, [activeModel, effort]);

  async function submit() {
    const nextPrompt = prompt.trim() || (project.status === 'draft' ? project.idea : '继续完成并验证当前游戏。');
    await onRun(nextPrompt, activeModel?.model ?? null, effort || null, targetFrameRate);
    setPrompt('');
  }

  return (
    <section className="composer">
      <div className="composer-body">
        <textarea
          value={prompt}
          rows={3}
          disabled={running || disabled}
          aria-label="给 Agent 的制作指令"
          placeholder={
            resumable
              ? '例如：降低敌人速度，补充受击反馈，然后重新构建验证…'
              : '描述你希望制作的游戏，或直接使用项目创意启动…'
          }
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (
              (event.metaKey || event.ctrlKey) &&
              event.key === 'Enter' &&
              !running &&
              !disabled
            ) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <details className="composer-advanced">
          <summary>
            <span><SlidersHorizontal size={13} /> 高级设置</span>
            <span className="composer-shortcut">⌘/CTRL + ENTER</span>
            <ChevronDown className="composer-advanced-chevron" size={14} />
          </summary>
          <div className="composer-advanced-content">
            <AssetRequirement
              variant="compact"
              imageGenerationAvailable={imageGenerationAvailable}
            />
            <FrameRateControl
              compact
              value={targetFrameRate}
              disabled={running || disabled}
              onChange={setTargetFrameRate}
            />
            <div className="composer-controls">
              <label>
                <span>模型</span>
                <select
                  value={activeModel?.model ?? ''}
                  disabled={running || disabled || models.length === 0}
                  onChange={(event) => setModel(event.target.value)}
                >
                  {models.length === 0 ? <option value="">暂无可用模型</option> : null}
                  {models.map((item) => (
                    <option value={item.model} key={item.id}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>推理强度</span>
                <select
                  value={effort}
                  disabled={running || disabled || !activeModel}
                  onChange={(event) => setEffort(event.target.value)}
                >
                  {(activeModel?.efforts ?? [settings.defaultEffort]).map((item) => (
                    <option value={item} key={item}>
                      {item.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <span className="composer-model-note">
                {activeModel?.description ?? '登录 Codex 后读取模型目录'}
              </span>
            </div>
          </div>
        </details>
      </div>
      {running ? (
        <button className="stop-button" type="button" onClick={() => void onStop()}>
          <Square size={14} fill="currentColor" />
          停止
        </button>
      ) : (
        <button
          className="run-button"
          type="button"
          disabled={disabled || models.length === 0}
          onClick={() => void submit()}
        >
          {resumable ? <RotateCcw size={15} /> : <Play size={15} fill="currentColor" />}
          {resumable ? '继续制作' : '开始制作'}
        </button>
      )}
    </section>
  );
}
