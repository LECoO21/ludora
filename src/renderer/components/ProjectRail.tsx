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
import { GameGlyph, ProjectAvatar } from './GameGlyph';
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
          <span className="rail-workspace-label">我的工作空间</span>
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

        <button className={`rail-home ${!selectedId ? 'is-active' : ''}`} type="button" aria-current={!selectedId ? 'page' : undefined} title="创作首页" onClick={onHome}>
          <GameGlyph kind="castle" /><span>创作首页</span>
        </button>
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
                aria-current={project.id === selectedId ? 'page' : undefined}
                onClick={() => onSelect(project)}
              >
                <ProjectAvatar name={project.name} />
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
          <div className="rail-studio-note"><GameGlyph kind="potion" /><strong>让灵感成为游戏</strong><span>一点想象，无限可能。</span></div>
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
