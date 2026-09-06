import { CheckCircle2, CircleDot } from 'lucide-react';

import {
  PIPELINE_STAGES,
  type PipelineStage,
  type ProjectStatus,
} from '../../shared/contracts';
import { PROJECT_STATUS_LABELS, stageProgress } from '../ui';

interface PipelineProps {
  stage: PipelineStage;
  status: ProjectStatus;
}

export function Pipeline({ stage, status }: PipelineProps) {
  const index = stageProgress(stage);
  const current = stage === 'complete' ? PIPELINE_STAGES.length : index + 1;
  const stageLabel = PIPELINE_STAGES[index]?.label ?? '准备制作';
  const percentage = Math.round((current / PIPELINE_STAGES.length) * 100);
  const completed = status === 'completed' || stage === 'complete';
  const StatusIcon = completed ? CheckCircle2 : CircleDot;

  return (
    <section className={`pipeline status-${status}`} aria-label="游戏制作进度">
      <div className="pipeline-summary">
        <span className="pipeline-state">
          <StatusIcon size={14} />
          <strong>{completed ? '游戏制作完成' : stageLabel}</strong>
          <small>{PROJECT_STATUS_LABELS[status]}</small>
        </span>
        <span className="pipeline-count">{current} / {PIPELINE_STAGES.length}</span>
      </div>
      <div
        className="pipeline-track"
        role="progressbar"
        aria-label={`${stageLabel}，${current}/${PIPELINE_STAGES.length}`}
        aria-valuemin={0}
        aria-valuemax={PIPELINE_STAGES.length}
        aria-valuenow={current}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
