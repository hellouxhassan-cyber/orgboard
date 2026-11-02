import type { OrgState, Person } from './types';

export const byId = (s: OrgState, id: string | null | undefined) => (id ? s.people.find(p => p.id === id) : undefined);
export const children = (s: OrgState, id: string) => s.people.filter(p => p.managerId === id);
export const root = (s: OrgState) => s.people.find(p => !p.managerId);

/** Everyone below a person, at any depth. */
export function descendants(s: OrgState, id: string): Person[] {
  const out: Person[] = [];
  const walk = (i: string) => children(s, i).forEach(k => { out.push(k); walk(k.id); });
  walk(id);
  return out;
}

/** Managers above a person, from the top of the company down. */
export function chain(s: OrgState, p: Person): Person[] {
  const c: Person[] = [];
  let m = byId(s, p.managerId);
  while (m) { c.unshift(m); m = byId(s, m.managerId); }
  return c;
}

/** People in reporting order (depth first), with their depth. */
export function treeOrder(s: OrgState): { p: Person; d: number }[] {
  const out: { p: Person; d: number }[] = [];
  const walk = (p: Person, d: number) => { out.push({ p, d }); children(s, p.id).forEach(k => walk(k, d + 1)); };
  const r = root(s);
  if (r) walk(r, 0);
  return out;
}

/** Finds an existing department by name, ignoring case and spacing, so "creative" reuses "Creative". */
export function matchDepartment(s: OrgState, name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return s.people.map(p => p.dept).find(d => d.trim().toLowerCase() === n) ?? name.trim();
}

export function departments(s: OrgState): string[] {
  const r = root(s);
  const names = [...new Set(s.people.map(p => (p.dept || '').trim()).filter(Boolean))];
  // The founder's own "department" is not a department when nobody else is in it.
  return names.filter(d => !(r && d === r.dept && s.people.filter(p => p.dept === d).length === 1));
}

/** True when moving `id` under `managerId` is allowed (no self, no cycles, no no-op). */
export function canReparent(s: OrgState, id: string, managerId: string): boolean {
  const p = byId(s, id), m = byId(s, managerId);
  if (!p || !m || id === managerId || p.managerId === managerId) return false;
  return !descendants(s, id).some(x => x.id === managerId);
}

export function reparent(s: OrgState, id: string, managerId: string): OrgState {
  if (!canReparent(s, id, managerId)) return s;
  return { ...s, people: s.people.map(p => (p.id === id ? { ...p, managerId } : p)) };
}

export function addReport(s: OrgState, managerId: string, newId: string, dept?: string): OrgState {
  const m = byId(s, managerId);
  if (!m) return s;
  const p: Person = {
    id: newId, name: 'New role', title: 'Untitled role', dept: dept ?? m.dept, managerId, outcome: '',
    kpi: { name: '', unit: 'number', dir: 'higher', target: null, current: null }
  };
  return { ...s, people: [...s.people, p] };
}

/** Removes a role. Its direct reports move up to its manager. The top of the company can't be removed. */
export function removeRole(s: OrgState, id: string): OrgState {
  const p = byId(s, id);
  if (!p || !p.managerId) return s;
  return {
    ...s,
    people: s.people.filter(x => x.id !== id).map(x => (x.managerId === id ? { ...x, managerId: p.managerId } : x))
  };
}

const UNITS = ['number', 'currency', 'percent', 'ratio', 'day'];
const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(n, MAX_VALUE)) : null;
};
/** Largest number any KPI field accepts. Keeps formatting readable and avoids exponent notation. */
export const MAX_VALUE = 1e12;

/**
 * Makes saved data safe to use, whatever shape it arrives in: fills in missing fields with sensible
 * defaults, drops entries that are not people, removes duplicate ids, keeps exactly one person at the
 * top, and breaks any reporting loops. Returns null when nothing usable is left.
 */
export function repair(input: unknown): OrgState | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as { company?: unknown; people?: unknown };
  if (!Array.isArray(d.people)) return null;
  const c = (d.company && typeof d.company === 'object' ? d.company : {}) as { name?: unknown; goal?: unknown };
  const company = { name: str(c.name, 'Halden'), goal: num(c.goal) || 5_000_000 };

  const seen = new Set<string>();
  const people: Person[] = [];
  for (const raw of d.people) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === 'string' && r.id ? r.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const k = (r.kpi && typeof r.kpi === 'object' ? r.kpi : {}) as Record<string, unknown>;
    people.push({
      id,
      name: str(r.name, 'Unnamed'),
      title: str(r.title, 'Untitled role'),
      dept: str(typeof r.dept === 'string' ? r.dept.trim() : r.dept, 'Unassigned'),
      managerId: typeof r.managerId === 'string' ? r.managerId : null,
      outcome: typeof r.outcome === 'string' ? r.outcome : '',
      kpi: {
        name: typeof k.name === 'string' ? k.name : '',
        unit: (UNITS.includes(k.unit as string) ? k.unit : 'number') as Person['kpi']['unit'],
        dir: k.dir === 'lower' ? 'lower' : 'higher',
        target: num(k.target),
        current: num(k.current)
      }
    });
  }
  if (!people.length) return null;

  const top = people.find(p => !p.managerId) ?? people.find(p => !seen.has(p.managerId!)) ?? people[0];
  top.managerId = null;
  people.forEach(p => {
    if (p !== top && (!p.managerId || !seen.has(p.managerId) || p.managerId === p.id)) p.managerId = top.id;
  });
  // Break any loop by attaching the looping person to the top.
  people.forEach(p => {
    const visited = new Set<string>([p.id]);
    let m = people.find(x => x.id === p.managerId);
    while (m) {
      if (visited.has(m.id)) { p.managerId = top.id; break; }
      visited.add(m.id);
      m = people.find(x => x.id === m!.managerId);
    }
  });
  return { v: 2, company, people };
}
