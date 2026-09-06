import type {
  AgentEventKind,
  PipelineStage,
  ProjectStatus,
  RuntimeStatus,
} from '../shared/contracts';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '待启动',
  running: '制作中',
  waiting: '待继续',
  completed: '已完成',
  failed: '需处理',
  stopped: '已停止',
};

export const EVENT_KIND_LABELS: Record<AgentEventKind, string> = {
  user: '用户',
  lifecycle: '状态',
  assistant: 'Agent',
  thought: '思考',
  tool: '工具',
  file: '文件',
  plan: '计划',
  approval: '审批',
  error: '异常',
};

export function runtimeLabel(runtime: RuntimeStatus): string {
  if (runtime.state === 'ready') {
    return runtime.account
      ? `${runtime.account.email ?? 'Codex 账号'} · 已就绪`
      : 'Codex 已就绪 · 未登录';
  }
  if (runtime.state === 'starting') return 'Codex 正在启动';
  if (runtime.state === 'error') return runtime.error ?? 'Codex 启动失败';
  return 'Codex 尚未启动';
}

export function stageProgress(stage: PipelineStage): number {
  const order: PipelineStage[] = [
    'brief',
    'scaffold',
    'gdd',
    'assets',
    'world',
    'code',
    'verify',
    'complete',
  ];
  return Math.max(0, order.indexOf(stage));
}

export function projectNameFromIdea(idea: string, now = new Date()): string {
  const firstThought = idea
    .trim()
    .split(/\r?\n/u, 1)[0]
    ?.split(/[。！？.!?]/u, 1)[0]
    ?.replace(/^(?:请|麻烦)?(?:帮我)?(?:制作|做|创建|开发)(?:一个|一款)?/u, '')
    .replace(/\s+/gu, ' ')
    .trim();

  if (firstThought) {
    const characters = Array.from(firstThought);
    let end = Math.min(24, characters.length);
    while (
      end < characters.length
      && end < 32
      && /[a-z0-9_-]/iu.test(characters[end - 1] ?? '')
      && /[a-z0-9_-]/iu.test(characters[end] ?? '')
    ) {
      end += 1;
    }
    return characters.slice(0, end).join('');
  }

  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  return `新游戏 ${stamp}`;
}

export function formatRelative(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return '—';
  const delta = Math.max(0, Date.now() - time);
  if (delta < 60_000) return '刚刚';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return `${Math.floor(delta / 86_400_000)}d`;
}

export function toMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(
    /^Error invoking remote method '[^']+':\s*(?:Error:\s*)?/,
    '',
  );
}
