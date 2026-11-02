import { describe, expect, it } from 'vitest';
import { CARD_W, layoutOrg } from './layout';
import { cloneSeed } from './seed';

describe('org chart layout', () => {
  const l = layoutOrg(cloneSeed());
  it('places every person and draws one line per reporting relationship', () => {
    expect(Object.keys(l.pos)).toHaveLength(13);
    expect(l.links).toHaveLength(12);
  });
  it('no two cards overlap', () => {
    const ps = Object.values(l.pos);
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j];
      const overlap = Math.abs(a.x - b.x) < CARD_W && Math.abs(a.y - b.y) < 128;
      expect(overlap).toBe(false);
    }
  });
});
