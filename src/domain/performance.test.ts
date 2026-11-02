import { describe, expect, it } from 'vitest';
import { byId } from './org';
import { clampForUnit, deptStats, gapText, ownLabel, ownStatus, ratio, stepFor, teamStatus, teamText } from './performance';
import { cloneSeed } from './seed';
import type { OrgState } from './types';

const get = (s: OrgState, id: string) => byId(s, id)!;
const setCurrent = (s: OrgState, id: string, v: number): OrgState => ({
  ...s, people: s.people.map(p => (p.id === id ? { ...p, kpi: { ...p.kpi, current: v } } : p))
});

describe('the brief example: Head of Creative with one editor behind', () => {
  const s = cloneSeed();

  it('Tom (18 of 30 videos) is Behind', () => {
    expect(ownStatus(get(s, 'p5'))).toBe('behind');
    expect(gapText(get(s, 'p5'))).toBe('12 short of target');
  });

  it('Marcus is personally On track but his team is off track', () => {
    const marcus = get(s, 'p3');
    expect(ownStatus(marcus)).toBe('on');
    const t = teamStatus(s, marcus)!;
    expect(t.status).toBe('behind');
    expect(teamText(t)).toBe('1 off track');
  });

  it('the problem shows further up: Priya (CMO) and Daniel (CEO)', () => {
    expect(ownStatus(get(s, 'p2'))).toBe('on');
    expect(teamStatus(s, get(s, 'p2'))!.off.map(p => p.id)).toContain('p5');
    expect(teamStatus(s, get(s, 'p1'))!.status).toBe('behind');
  });

  it('when Tom reaches 30, Marcus, Creative and the path above clear automatically', () => {
    const fixed = setCurrent(s, 'p5', 30);
    expect(ownStatus(get(fixed, 'p5'))).toBe('on');
    expect(teamText(teamStatus(fixed, get(fixed, 'p3'))!)).toBe('All on track');
    expect(deptStats(fixed, 'Creative').status).toBe('on');
    // Daniel still sees the two people at risk elsewhere, but nobody is behind any more.
    expect(teamStatus(fixed, get(fixed, 'p1'))!.status).toBe('risk');
  });
});

describe('status rules', () => {
  it('85 to 99% of target is At risk', () => {
    const s = cloneSeed();
    expect(ownStatus(get(s, 'p7'))).toBe('risk'); // 23 of 25 = 92%
  });

  it('lower is better: books closed on day 4 against a day 5 target is On track', () => {
    const s = cloneSeed();
    const jason = get(s, 'p13');
    expect(ratio(jason.kpi)).toBeCloseTo(1.25);
    expect(ownStatus(jason)).toBe('on');
    expect(gapText(jason)).toBe('1 day ahead of target');
    const late = setCurrent(s, 'p13', 7);
    expect(ownStatus(get(late, 'p13'))).toBe('behind');
  });

  it('own and team status are independent (Nina at risk, her team fine)', () => {
    const s = cloneSeed();
    expect(ownStatus(get(s, 'p8'))).toBe('risk');
    expect(teamText(teamStatus(s, get(s, 'p8'))!)).toBe('All on track');
  });

  it('a role with no KPI is not counted as failing', () => {
    const s = cloneSeed();
    const p = get(s, 'p11');
    p.kpi.name = '';
    expect(ownStatus(p)).toBe('none');
    expect(teamText(teamStatus(s, get(s, 'p10'))!)).toBe('1 without a KPI');
  });
});

describe('number rules', () => {
  it('keeps days whole and between 1 and 31', () => {
    expect(clampForUnit(3.6, 'day')).toBe(4);
    expect(clampForUnit(10003, 'day')).toBe(31);
    expect(clampForUnit(0, 'day')).toBe(1);
  });
  it('never goes negative or into exponent sized numbers', () => {
    expect(clampForUnit(-5, 'number')).toBe(0);
    expect(clampForUnit(1e30, 'currency')).toBe(1e12);
  });
  it('steps by about 1% of the target for money', () => {
    expect(stepFor('currency', 2_200_000)).toBe(20_000);
    expect(stepFor('currency', 3)).toBe(1);
    expect(stepFor('ratio', 3)).toBe(0.1);
  });
});

describe('wording when a KPI is incomplete', () => {
  it('says what is missing instead of "No KPI yet"', () => {
    const s = cloneSeed();
    const tom = byId(s, 'p5')!;
    tom.kpi.target = null;
    expect(ownLabel(tom)).toBe('Needs a target');
    tom.kpi.target = 30; tom.kpi.current = null;
    expect(ownLabel(tom)).toBe('Needs a number');
  });
  it('a team with an unmeasured person is not called all on track', () => {
    const s = cloneSeed();
    byId(s, 'p5')!.kpi.target = null; // Tom now has no target
    const t = teamStatus(s, byId(s, 'p3')!)!;
    expect(teamText(t)).toBe('1 without a KPI');
  });
});

