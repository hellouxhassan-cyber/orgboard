import { children, descendants, root } from './org';
import type { Kpi, OrgState, Person, Severity, Status, Unit } from './types';

export const RANK: Record<Severity, number> = { on: 0, risk: 1, behind: 2 };
export const STATUS_LABEL: Record<Status, string> = { on: 'On track', risk: 'At risk', behind: 'Behind', none: 'No KPI yet' };

/** The own status label for a person. When there is no status yet, says what is missing. */
export function ownLabel(p: Person): string {
  const s = ownStatus(p);
  if (s !== 'none') return STATUS_LABEL[s];
  if (!p.kpi.name) return 'No KPI yet';
  if (p.kpi.target == null) return 'Needs a target';
  return 'Needs a number';
}
export const AT_RISK_FROM = 0.85;

/** How close a KPI is to target. 1 means exactly on target. Handles "lower is better". */
export function ratio(k: Kpi | undefined): number | null {
  if (!k || !k.name || k.target == null || k.current == null) return null;
  const t = +k.target, c = +k.current;
  if (k.dir === 'lower') return c <= 0 ? 1 : t / c;
  return t <= 0 ? 1 : c / t;
}

/** Own status: 100%+ on track, 85 to 99% at risk, under 85% behind. */
export function ownStatus(p: Person): Status {
  const r = ratio(p.kpi);
  if (r == null) return 'none';
  if (r >= 1) return 'on';
  if (r >= AT_RISK_FROM) return 'risk';
  return 'behind';
}

export function worst(list: (Status | null | undefined)[]): Severity {
  return list.reduce<Severity>((a, b) => (b && b !== 'none' && RANK[b] > RANK[a] ? b : a), 'on');
}

export const isOff = (p: Person) => { const s = ownStatus(p); return s === 'behind' || s === 'risk'; };

export interface TeamStatus { total: number; off: Person[]; none: Person[]; onCount: number; status: Severity }

/** Team status looks at everyone below a person, not just direct reports. */
export function teamStatus(s: OrgState, p: Person): TeamStatus | null {
  const d = descendants(s, p.id);
  if (!d.length) return null;
  const off = d.filter(isOff);
  const none = d.filter(x => ownStatus(x) === 'none');
  return { total: d.length, off, none, onCount: d.length - off.length - none.length, status: worst(off.map(ownStatus)) };
}

/** Short team summary for cards and tags. Only says "All on track" when every measured person is. */
export const teamText = (t: TeamStatus) =>
  t.off.length ? `${t.off.length} off track` : t.none.length ? `${t.none.length} without a KPI` : 'All on track';
export const teamSeverity = (t: TeamStatus): Severity => (t.off.length ? t.status : 'on');
/** Color class for the team summary: status color when off track, neutral when someone is unmeasured. */
export const teamClass = (t: TeamStatus): Status => (t.off.length ? t.status : t.none.length ? 'none' : 'on');

/** The color of the line from a person up to their manager: worst of their own and their team's status. */
export function lineSeverity(s: OrgState, p: Person): Severity {
  const t = teamStatus(s, p);
  return worst([ownStatus(p), t && t.off.length ? t.status : null]);
}

export interface DeptStats { members: Person[]; on: number; status: Severity; score: number | null }
/** A department is as healthy as its weakest result. Score is the average KPI ratio, capped at 125%. */
export function deptStats(s: OrgState, dept: string): DeptStats {
  const members = s.people.filter(p => p.dept === dept);
  const ss = members.map(ownStatus);
  const rs = members.map(p => ratio(p.kpi)).filter((r): r is number => r != null);
  return {
    members,
    on: ss.filter(x => x === 'on').length,
    status: worst(ss),
    score: rs.length ? rs.reduce((a, b) => a + Math.min(b, 1.25), 0) / rs.length : null
  };
}

export const progressPct = (p: Person) => { const r = ratio(p.kpi); return r == null ? 0 : Math.max(0, Math.min(1, r)) * 100; };

export function offList(s: OrgState): Person[] {
  return s.people.filter(isOff).sort((a, b) =>
    RANK[ownStatus(b) as Severity] - RANK[ownStatus(a) as Severity] || (ratio(a.kpi) ?? 0) - (ratio(b.kpi) ?? 0));
}

/** Managers whose own number is fine but whose team is not. */
export function hiddenProblems(s: OrgState): Person[] {
  return s.people.filter(p => { const t = teamStatus(s, p); return !!t && t.off.length > 0 && ownStatus(p) === 'on'; });
}

export const companyKpi = (s: OrgState) => root(s)?.kpi;
export const directReports = children;

/* ---------- Formatting ---------- */
export const trim = (v: number, d = 1) => Number((+v).toFixed(d)).toLocaleString('en-US');
export function money(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return '$' + trim(v / 1e6, 2) + 'M';
  if (a >= 1e3) return '$' + trim(v / 1e3, 0) + 'K';
  return '$' + trim(v, 0);
}
export function fmt(v: number | null | undefined, unit: Unit): string {
  if (v == null) return '–';
  switch (unit) {
    case 'currency': return money(+v);
    case 'percent': return trim(v) + '%';
    case 'ratio': return trim(v, 2) + '×';
    case 'day': return 'Day ' + trim(v, 0);
    default: return trim(v);
  }
}
function diff(d: number, unit: Unit): string {
  switch (unit) {
    case 'currency': return money(d);
    case 'percent': return trim(d) + (+d === 1 ? ' pt' : ' pts');
    case 'ratio': return trim(d, 2);
    case 'day': return trim(d, 0) + (Math.round(d) === 1 ? ' day' : ' days');
    default: return trim(d);
  }
}
/** Plain sentence describing the gap to target, e.g. "12 short of target". */
export function gapText(p: Person): string {
  const k = p.kpi;
  if (ownStatus(p) === 'none') return !k.name ? 'No KPI assigned yet' : k.target == null ? 'Add a target to start tracking' : 'Add this month’s number';
  const t = +k.target!, c = +k.current!;
  const d = k.dir === 'lower' ? c - t : t - c;
  if (d > 0) return `${diff(d, k.unit)} ${k.dir === 'lower' ? 'over' : 'short of'} target`;
  if (d < 0) return `${diff(-d, k.unit)} ${k.dir === 'lower' ? 'ahead of' : 'above'} target`;
  return 'Exactly on target';
}
/** A step that suits the size of the number: 1% of the target, rounded to 1, 2 or 5 times a power of ten. */
export function stepFor(u: Unit, target?: number | null): number {
  if (u === 'ratio') return 0.1;
  if (u === 'day' || u === 'percent') return 1;
  const base = Math.max(1, Math.abs(target ?? 0) * 0.01);
  const pow = 10 ** Math.floor(Math.log10(base));
  const m = base / pow;
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * pow;
}

/** Keeps a typed value valid for its unit: never negative, never huge, and days are whole numbers from 1 to 31. */
export function clampForUnit(v: number, u: Unit): number {
  let n = Math.max(0, Math.min(v, 1e12));
  if (u === 'day') n = Math.min(31, Math.max(1, Math.round(n)));
  return n;
}

/** The current month's name, used in copy like "off track in November". */
export const monthName = (d = new Date()) => d.toLocaleString('en-US', { month: 'long' });
export const initials = (n: string) => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const firstName = (n: string) => (n || '').split(' ')[0];
