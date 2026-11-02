import { useRef } from 'react';
import { byId, treeOrder } from '../domain/org';
import { fmt, isOff, ownLabel, ownStatus, ratio, RANK, teamClass, teamSeverity, teamStatus, teamText } from '../domain/performance';
import type { Person } from '../domain/types';
import { useStore } from '../state/context';
import { tableMatches } from '../state/selectors';
import type { SortKey } from '../state/store';
import { IconSort, IconSortDown, IconSortUp } from './Icons';
import { Avatar } from './Avatar';
import { NumberField } from './NumberField';

const COLS: { key: SortKey | null; label: string }[] = [
  { key: 'name', label: 'Person' }, { key: null, label: 'KPI' }, { key: null, label: 'This month' }, { key: null, label: 'Target' },
  { key: 'progress', label: 'Progress' }, { key: 'team', label: 'Team' }, { key: 'mgr', label: 'Reports to' }
];

export function PeopleTable({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, ui, patchUi, actions } = useStore();
  // While someone types a number, keep row order still so the row they are editing never jumps away.
  const editing = useRef<string | null>(null);
  const frozen = useRef<string[]>([]);

  let rows: Person[];
  if (editing.current && frozen.current.length) {
    rows = frozen.current.map(id => byId(state, id)).filter((p): p is Person => !!p);
  } else {
    const list = treeOrder(state).map(({ p }, i) => ({ p, i }))
      .filter(({ p }) => tableMatches(p, ui));
    const { key, dir } = ui.sort;
    const val = ({ p, i }: { p: Person; i: number }): number | string => {
      if (key === 'progress') return ratio(p.kpi) ?? -1;
      if (key === 'team') { const t = teamStatus(state, p); return t ? RANK[teamSeverity(t)] * 100 + t.off.length : -1; }
      if (key === 'mgr') return byId(state, p.managerId)?.name ?? '';
      if (key === 'name') return p.name.toLowerCase();
      return i;
    };
    list.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : a.i - b.i) * dir; });
    rows = list.map(r => r.p);
    frozen.current = rows.map(p => p.id);
  }

  const sortBy = (k: SortKey) => patchUi({ sort: ui.sort.key === k ? { key: k, dir: (ui.sort.dir * -1) as 1 | -1 } : { key: k, dir: k === 'name' || k === 'mgr' ? 1 : -1 } });

  return (
    <section className="box" id="sec-people" aria-label="People and KPIs">
      <div className="box-head" style={{ alignItems: 'center' }}>
        <div><h2>People &amp; KPIs</h2><p>Update this month’s numbers, and see each person’s own and team status in one view.</p></div>
        <span className="box-count">{ui.mode === 'off' ? `${rows.length} off track` : `${rows.length} of ${state.people.length} people`}</span>
      </div>
      <div className="twrap">
        <table>
          <thead><tr>{COLS.map(c => (
            <th key={c.label} aria-sort={c.key && ui.sort.key === c.key ? (ui.sort.dir === 1 ? 'ascending' : 'descending') : undefined}>{c.key
              ? <button onClick={() => sortBy(c.key!)} data-active={ui.sort.key === c.key ? '' : undefined}>{c.label}
                  {ui.sort.key === c.key ? (ui.sort.dir === 1 ? <IconSortUp /> : <IconSortDown />) : <IconSort />}</button>
              : <span className="static">{c.label}</span>}</th>
          ))}</tr></thead>
          <tbody>
            {rows.length ? rows.map(p => {
              const k = p.kpi, s = ownStatus(p), t = teamStatus(state, p), m = byId(state, p.managerId), r = ratio(k);
              return (
                <tr key={p.id} className={`row${ui.selected === p.id ? ' sel' : ''}`} tabIndex={0}
                  onClick={e => { if (!(e.target as HTMLElement).closest('input')) onOpen(p.id); }}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(p.id); } }}>
                  <td><div className="pcell"><span className={`tag ${s}`}>{ownLabel(p)}</span><div><b>{p.name}</b><small>{p.title} · {p.dept}</small></div></div></td>
                  <td style={{ color: 'var(--fg-2)' }}>{k.name || '–'}</td>
                  <td onFocus={() => { editing.current = p.id; }} onBlur={() => { editing.current = null; patchUi({}); }}>
                    <NumberField className="num-in" value={k.current} unit={k.unit} label={`This month for ${p.name}`} disabled={!k.name}
                      onChange={v => actions.updateKpi(p.id, { current: v })} />
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{fmt(k.target, k.unit)}{k.dir === 'lower' && <small style={{ display: 'block', fontSize: 12, color: 'var(--faint)' }}>lower is better</small>}</td>
                  <td><span className={`pct s-${s}`}>{r == null ? '–' : `${Math.round(r * 100)}%`}</span></td>
                  <td>{t ? <span className={`st s-${teamClass(t)}`}><i className="dot" />{teamText(t)}</span> : <span style={{ color: 'var(--faint)' }}>No reports</span>}</td>
                  <td>{m ? <span className="chip"><Avatar name={m.name} dept={m.dept} size={18} />{m.name}</span> : <span style={{ color: 'var(--faint)' }}>Top of company</span>}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={7} style={{ border: '1px solid var(--line)', borderRadius: 10, color: 'var(--muted)', padding: 18 }}>{ui.mode === 'off' && !state.people.some(isOff) ? 'Nobody is off track this month.' : 'No one matches. Clear the search or filters to see everyone.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
