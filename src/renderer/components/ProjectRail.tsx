import {
  FolderKanban,
  Gauge,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  X,
} from 'lucide-react';

import type { ProjectRecord, RuntimeStatus } from '../../shared/contracts';
import { BrandMark } from './BrandMark';
import {
  formatRelative,
  PROJECT_STATUS_LABELS,
} from '../ui';

interface ProjectRailProps {
  projects: readonly ProjectRecord[];
  selectedId?: string;
  runtime: RuntimeStatus;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  onHome: () => void;
  onSelect: (project: ProjectRecord) => void;
  onCreate: () => void;
  onSettings: () => void;
}

export function ProjectRail({
  projects,
  selectedId,
  runtime,
  open,
  collapsed,
  onClose,
  onToggleCollapsed,
  onHome,
  onSelect,
  onCreate,
  onSettings,
}: ProjectRailProps) {
  return (
    <>
      <button
        className={`rail-scrim ${open ? 'is-visible' : ''}`}
        type="button"
        aria-label="关闭项目导航"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className={`project-rail ${open ? 'is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
        <div className="rail-brand-row">
          <button className="brand" type="button" title="Ludora 首页" onClick={onHome}>
            <BrandMark />
            <span className="brand-copy">
              <strong>Ludora</strong>
              <small>TURN IDEAS INTO PLAYABLE WORLDS</small>
            </span>
          </button>
          <button
            className="icon-button rail-collapse"
            type="button"
            aria-label={collapsed ? '展开项目栏' : '收起项目栏'}
            title={collapsed ? '展开项目栏' : '收起项目栏'}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button
            className="icon-button rail-close"
            type="button"
            aria-label="关闭项目导航"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <button className="new-project-button" type="button" title="新建游戏" onClick={onCreate}>
          <Plus size={16} />
          <span>新建游戏</span>
        </button>

        <div className="rail-section-heading">
          <span>我的项目</span>
          <strong>{String(projects.length).padStart(2, '0')}</strong>
        </div>

        <nav className="project-list" aria-label="游戏项目">
          {projects.length ? (
            projects.map((project) => (
              <button
                key={project.id}
                type="button"
                title={`${project.name} · ${PROJECT_STATUS_LABELS[project.status]}`}
                className={`project-item ${project.id === selectedId ? 'is-active' : ''}`}
                onClick={() => onSelect(project)}
              >
                <span
                  className={`status-dot status-${project.status}`}
                  aria-hidden="true"
                />
                <span className="project-item-copy">
                  <strong>{project.name}</strong>
                  <small>{PROJECT_STATUS_LABELS[project.status]}</small>
                </span>
                <time dateTime={project.updatedAt}>
                  {formatRelative(project.updatedAt)}
                </time>
              </button>
            ))
          ) : (
            <div className="project-empty">
              <FolderKanban size={22} />
              <strong>还没有游戏项目</strong>
              <span>从一句清晰的创意开始。</span>
            </div>
          )}
        </nav>

        <div className="rail-footer">
          <button
            type="button"
            className="runtime-mini"
            onClick={onSettings}
          >
            <Gauge size={15} />
            <span>
              <strong>{runtime.account ? 'Codex 已连接' : runtime.state === 'ready' ? '登录 Codex' : '检查运行环境'}</strong>
              <small>{runtime.account?.email ?? '开始制作前完成登录'}</small>
            </span>
            <i className={`runtime-dot state-${runtime.state}`} />
          </button>
          <button className="rail-settings" type="button" title="设置" onClick={onSettings}>
            <Settings size={15} />
            <span>设置</span>
          </button>
        </div>
      </aside>
    </>
  );
}
