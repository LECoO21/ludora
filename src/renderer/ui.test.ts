import { describe, expect, it } from 'vitest';

import { projectNameFromIdea } from './ui';

describe('projectNameFromIdea', () => {
  it('removes common request prefixes from Chinese ideas', () => {
    expect(projectNameFromIdea('帮我制作一个俯视角收集游戏，收集五颗星星获胜。'))
      .toBe('俯视角收集游戏，收集五颗星星获胜');
  });

  it('uses only the first sentence and keeps English names readable', () => {
    expect(projectNameFromIdea('Build a tiny space runner. Add three stages.'))
      .toBe('Build a tiny space runner');
  });

  it('does not split emoji surrogate pairs when truncating', () => {
    const result = projectNameFromIdea('🎮'.repeat(30));
    expect(Array.from(result)).toHaveLength(24);
  });

  it('creates a deterministic fallback for blank input', () => {
    expect(projectNameFromIdea('   ', new Date(2026, 8, 4, 9, 7)))
      .toBe('新游戏 20260904-0907');
  });
});
