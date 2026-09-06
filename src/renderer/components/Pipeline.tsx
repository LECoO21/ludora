import { ChevronDown } from 'lucide-react';

import {
  PIPELINE_STAGES,
  type PipelineStage,
  type ProjectStatus,
} from '../../shared/contracts';
import { PROJECT_STATUS_LABELS, stageProgress } from '../ui';
import { GameGlyph, type GlyphKind } from './GameGlyph';

const stageGlyphs: Record<PipelineStage, GlyphKind> = {
  brief: 'planner',
  scaffold: 'developer',
  gdd: 'game',
  assets: 'potion',
  world: 'castle',
  code: 'developer',
  verify: 'reviewer',
  complete: 'chest',
};

interface PipelineProps {
  stage: PipelineStage;
  status: ProjectStatus;
}

export function Pipeline({ stage, status }: PipelineProps) {
  const index = stageProgress(stage);
  const current = stage === 'complete' ? PIPELINE_STAGES.length : index + 1;
  const stageLabel = PIPELINE_STAGES[index]?.label ?? '准备制作';
  const completed = status === 'completed' || stage === 'complete';
  return (
    <details
      className={`pipeline status-${status}`}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          event.currentTarget.scrollIntoView({ block: 'nearest' });
        }
      }}
    >
      <summary className="pipeline-toggle" aria-label={`制作流程：${stageLabel}，${current}/${PIPELINE_STAGES.length}，${PROJECT_STATUS_LABELS[status]}`}>
        <span className="pipeline-current">{stageLabel}</span>
        <span className="pipeline-count">{current} / {PIPELINE_STAGES.length}</span>
        <ChevronDown size={14} className="pipeline-chevron" aria-hidden="true" />
      </summary>
      <div className="pipeline-details">
        <div className="pipeline-title">
          <strong>制作流程</strong>
          <span>{PROJECT_STATUS_LABELS[status]}</span>
        </div>
        <div
          className="pipeline-track"
          role="progressbar"
          aria-label="游戏制作进度"
          aria-valuemin={0}
          aria-valuemax={PIPELINE_STAGES.length}
          aria-valuenow={current}
          aria-valuetext={`${stageLabel}，${current}/${PIPELINE_STAGES.length}，${PROJECT_STATUS_LABELS[status]}`}
        >
          <span style={{ width: `${current / PIPELINE_STAGES.length * 100}%` }} />
        </div>
        <ol className="stage-steps">
          {PIPELINE_STAGES.map((item, itemIndex) => {
            const done = completed || itemIndex < index;
            const active = !completed && itemIndex === index;
            return (
              <li key={item.id} className={done ? 'is-done' : active ? 'is-active' : ''} aria-current={active ? 'step' : undefined}>
                <GameGlyph kind={stageGlyphs[item.id]} />
                <strong>{item.label}</strong>
                <small>{done ? '已完成' : active ? '当前阶段' : '待进行'}</small>
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}
