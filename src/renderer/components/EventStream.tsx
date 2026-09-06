import {
  AlertTriangle,
  Bot,
  Brain,
  ChevronDown,
  CircleDot,
  FileCode2,
  ListChecks,
  ShieldCheck,
  Terminal,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { AgentEvent, ProjectRecord } from '../../shared/contracts';
import { EVENT_KIND_LABELS } from '../ui';

interface EventStreamProps {
  project: ProjectRecord;
  events: readonly AgentEvent[];
}

const EVENT_ICONS = {
  user: UserRound,
  lifecycle: CircleDot,
  assistant: Bot,
  thought: Brain,
  tool: Terminal,
  file: FileCode2,
  plan: ListChecks,
  approval: ShieldCheck,
  error: AlertTriangle,
} as const;

export function EventStream({ project, events }: EventStreamProps) {
  const streamRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const visibleEvents = showTechnicalDetails
    ? events
    : events.filter((event) => event.kind !== 'thought');

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const frame = requestAnimationFrame(() => {
      stream.scrollTop = stream.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [events.length, events.at(-1)?.message, project.id]);

  useEffect(() => {
    setShowTechnicalDetails(false);
    setExpanded({});
  }, [project.id]);

  return (
    <div className="event-stream" ref={streamRef} aria-live="polite">
      <article className="brief-card">
        <span className="eyebrow">游戏创意</span>
        <h2>{project.name}</h2>
        <p>{project.idea}</p>
        {showTechnicalDetails ? (
          <footer>
            <span>{project.root}</span>
            <time dateTime={project.createdAt}>
              {new Date(project.createdAt).toLocaleString('zh-CN')}
            </time>
          </footer>
        ) : null}
      </article>

      <div className="event-stream-toolbar">
        <span>{events.length ? `${events.length} 条制作记录` : '制作记录'}</span>
        <button
          type="button"
          aria-pressed={showTechnicalDetails}
          onClick={() => setShowTechnicalDetails((current) => !current)}
        >
          <Terminal size={13} /> {showTechnicalDetails ? '隐藏详细日志' : '查看详细日志'}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="stream-empty">
          <CircleDot size={22} />
          <strong>{project.status === 'draft' ? 'Agent 等待启动' : '等待新的制作事件'}</strong>
          <p>
            {project.status === 'draft'
              ? '启动后，这里会持续展示计划、工具调用、文件变化和验证结果。'
              : '在下方输入修改要求，Ludora 会在同一 Codex 线程中继续。'}
          </p>
        </div>
      ) : null}

      <div className="event-list">
        {visibleEvents.map((event) => {
          const Icon = EVENT_ICONS[event.kind];
          const isLong = event.message.length > 520;
          const isExpanded = expanded[event.id] === true;
          const technicalBody = event.kind === 'tool' || event.kind === 'file';
          return (
            <article
              className={`event-row event-${event.kind} ${event.isDelta ? 'is-streaming' : ''}`}
              key={event.id}
            >
              <div className="event-rail" aria-hidden="true">
                <span>
                  <Icon size={14} />
                </span>
              </div>
              <div className="event-card">
                <header>
                  <div>
                    <span className="event-kind">
                      {EVENT_KIND_LABELS[event.kind]}
                    </span>
                    <strong>{event.title}</strong>
                  </div>
                  <time dateTime={event.timestamp}>
                    {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: showTechnicalDetails ? '2-digit' : undefined,
                      hour12: false,
                    })}
                  </time>
                </header>
                {showTechnicalDetails && event.method ? <code>{event.method}</code> : null}
                {!technicalBody || showTechnicalDetails ? (
                  <pre className={isLong && !isExpanded ? 'is-collapsed' : ''}>
                    {event.message}
                  </pre>
                ) : (
                  <p className="event-technical-summary">技术详情已收起，可在详细日志中查看。</p>
                )}
                {isLong && (!technicalBody || showTechnicalDetails) ? (
                  <button
                    className="event-expand"
                    type="button"
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [event.id]: !isExpanded,
                      }))
                    }
                  >
                    <ChevronDown
                      size={13}
                      className={isExpanded ? 'is-open' : ''}
                    />
                    {isExpanded ? '收起' : '展开完整内容'}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {project.status === 'running' ? (
        <div className="live-indicator">
          <span className="pulse" />
          Ludora 正在制作游戏
        </div>
      ) : null}
    </div>
  );
}
