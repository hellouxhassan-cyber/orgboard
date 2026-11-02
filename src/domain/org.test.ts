import { describe, expect, it } from 'vitest';
import { addReport, byId, canReparent, children, removeRole, reparent, repair } from './org';
import { cloneSeed } from './seed';
import type { OrgState } from './types';

describe('restructuring', () => {
  it('removing a manager moves their reports up to their manager', () => {
    const s = removeRole(cloneSeed(), 'p3'); // Marcus
    expect(byId(s, 'p3')).toBeUndefined();
    expect(byId(s, 'p4')!.managerId).toBe('p2');
    expect(byId(s, 'p5')!.managerId).toBe('p2');
  });

  it('the top of the company cannot be removed', () => {
    const s = cloneSeed();
    expect(removeRole(s, 'p1')).toBe(s);
  });

  it('reparent refuses to create a cycle', () => {
    const s = cloneSeed();
    expect(canReparent(s, 'p2', 'p5')).toBe(false); // Priya under her own report's report
    expect(reparent(s, 'p2', 'p5')).toBe(s);
    expect(canReparent(s, 'p3', 'p3')).toBe(false);
  });

  it('reparent moves a person and their team with them', () => {
    const s = reparent(cloneSeed(), 'p3', 'p1');
    expect(byId(s, 'p3')!.managerId).toBe('p1');
    expect(children(s, 'p3').map(p => p.id)).toEqual(['p4', 'p5']);
  });

  it('a new direct report inherits the manager department', () => {
    const s = addReport(cloneSeed(), 'p10', 'new1');
    expect(byId(s, 'new1')).toMatchObject({ managerId: 'p10', dept: 'Support', name: 'New role' });
  });
});

describe('repair of saved data', () => {
  it('fixes orphaned and self managers and keeps one top person', () => {
    const s = cloneSeed() as OrgState;
    s.people.find(p => p.id === 'p4')!.managerId = 'gone';
    s.people.find(p => p.id === 'p6')!.managerId = 'p6';
    const fixed = repair(s)!;
    expect(byId(fixed, 'p4')!.managerId).toBe('p1');
    expect(byId(fixed, 'p6')!.managerId).toBe('p1');
    expect(fixed.people.filter(p => !p.managerId)).toHaveLength(1);
  });

  it('breaks reporting loops', () => {
    const s = cloneSeed();
    s.people.find(p => p.id === 'p2')!.managerId = 'p3';
    const fixed = repair(s)!;
    const seen = new Set<string>();
    let m = byId(fixed, 'p3');
    while (m && !seen.has(m.id)) { seen.add(m.id); m = byId(fixed, m.managerId); }
    expect(m).toBeUndefined();
  });

  it('fills in a missing department, company and KPI unit instead of crashing', () => {
    const raw = JSON.parse(JSON.stringify(cloneSeed()));
    delete raw.company;
    delete raw.people[4].dept;
    delete raw.people[5].kpi.unit;
    raw.people[6].kpi.current = 'abc';
    const fixed = repair(raw)!;
    expect(fixed.company).toEqual({ name: 'Halden', goal: 5_000_000 });
    expect(byId(fixed, 'p5')!.dept).toBe('Unassigned');
    expect(byId(fixed, 'p6')!.kpi.unit).toBe('number');
    expect(byId(fixed, 'p7')!.kpi.current).toBeNull();
  });

  it('drops entries that are not people but keeps everyone else', () => {
    const raw = JSON.parse(JSON.stringify(cloneSeed()));
    raw.people.splice(3, 0, null, 'oops', 42);
    const fixed = repair(raw)!;
    expect(fixed.people).toHaveLength(13);
  });

  it('removes duplicate ids and returns null when nothing usable is left', () => {
    const raw = JSON.parse(JSON.stringify(cloneSeed()));
    raw.people.push({ ...raw.people[4], name: 'Copy' });
    expect(repair(raw)!.people).toHaveLength(13);
    expect(repair({ people: [null] })).toBeNull();
    expect(repair('{bad json')).toBeNull();
  });
});

describe('adding roles', () => {
  it('can place a new role in a chosen department', () => {
    const s = addReport(cloneSeed(), 'p1', 'n1', 'Unassigned');
    expect(byId(s, 'n1')!.dept).toBe('Unassigned');
  });
});
