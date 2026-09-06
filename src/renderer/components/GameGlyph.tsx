import type { CSSProperties } from 'react';
import atlas from '../assets/ludora-workbench-atlas.png';

export type GlyphKind = 'castle' | 'game' | 'potion' | 'chest' | 'planner' | 'developer' | 'reviewer' | 'user';
const kinds: GlyphKind[] = ['castle', 'game', 'potion', 'chest', 'planner', 'developer', 'reviewer', 'user'];

/** Decorative, local artwork. The adjacent text supplies the accessible label. */
export function GameGlyph({ kind, className = '' }: { kind: GlyphKind; className?: string }) {
  const index = kinds.indexOf(kind);
  return <span aria-hidden="true" className={`game-glyph ${className}`} style={{
    backgroundImage: `url(${atlas})`,
    backgroundPosition: `${(index % 4) * 100 / 3}% ${index < 4 ? 10 : 90}%`,
  } as CSSProperties} />;
}

export function ProjectAvatar({ name }: { name: string }) {
  const seed = Array.from(name).reduce((sum, character) => sum + character.codePointAt(0)!, 0);
  return <GameGlyph kind={kinds[seed % 4]!} className="project-avatar" />;
}
