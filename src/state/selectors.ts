import { byId, chain, descendants } from '../domain/org';
import { isOff, lineSeverity } from '../domain/performance';
import type { OrgState, Person } from '../domain/types';
import type { UiState } from './store';

export const matchesQuery = (p: Person, q: string) =>
  !q.trim() || `${p.name} ${p.title} ${p.dept} ${p.kpi.name}`.toLowerCase().includes(q.trim().toLowerCase());

/** People to keep in focus on the chart. Null means nothing is filtered. Hover wins over filters. */
export function keepSet(s: OrgState, ui: UiState): Set<string> | null {
  if (ui.hoverId) {
    const p = byId(s, ui.hoverId);
    if (p) return new Set([p.id, ...chain(s, p).map(x => x.id), ...descendants(s, p.id).map(x => x.id)]);
  }
  let keep: Set<string> | null = null;
  const and = (ids: Set<string>) => { keep = keep ? new Set([...keep].filter(x => ids.has(x))) : ids; };
  if (ui.query.trim()) and(new Set(s.people.filter(p => matchesQuery(p, ui.query)).map(p => p.id)));
  if (ui.dept) and(new Set(s.people.filter(p => p.dept === ui.dept).map(p => p.id)));
  if (ui.mode === 'off') and(new Set(s.people.filter(p => lineSeverity(s, p) !== 'on').map(p => p.id)));
  return keep;
}

/**
 * "Off track only" rule, in one place:
 * the table and the count list only people below target; the chart also keeps their managers
 * in view, so the path from the problem to the founder stays visible.
 */
export const tableMatches = (p: Person, ui: UiState) =>
  matchesQuery(p, ui.query) && (!ui.dept || p.dept === ui.dept) && (ui.mode !== 'off' || isOff(p));
