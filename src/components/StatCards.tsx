import { departments, root } from '../domain/org';
import { deptStats, fmt, money, ownStatus, RANK, STATUS_LABEL, trim } from '../domain/performance';
import { useStore } from '../state/context';
import { scrollToSection } from '../state/dom';
import { IconArrow, StatDepts, StatGoal, StatPeople, StatRevenue } from './Icons';

/** The company in four numbers: one strip, split by dividers, read left to right from money to people. */
export function StatCards({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const r = root(state), k = r?.kpi;
  const rev = k && k.unit === 'currency' && k.current != null ? +k.current : null;
  const goal = state.company.goal;
  const ss = state.people.map(ownStatus);
  const on = ss.filter(s => s === 'on').length;
  const off = ss.filter(s => s === 'behind' || s === 'risk').length;
  const ds = departments(state).map(d => ({ d, ...deptStats(state, d) }));
  const clear = ds.filter(x => x.status === 'on').length;
  const worstD = ds.filter(x => x.status !== 'on').sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  const delta = k && k.target != null && rev != null ? (rev - +k.target) / +k.target * 100 : null;

  return (
    <section className="strip" aria-label="Company summary">
      <div className="cell">
        <div className="cell-head"><StatRevenue className="i acc" />{k?.name || 'Company KPI'}
          {r && <button className="go" aria-label={`Open ${r.name}`} onClick={() => onOpen(r.id)}><IconArrow /></button>}</div>
        <div className="cell-n">{k ? fmt(k.current, k.unit) : '–'}</div>
        <div className="cell-note">{delta != null && <><b className={delta >= 0 ? 's-on' : `s-${ownStatus(r!)}`}>{delta >= 0 ? '+' : ''}{trim(delta, 1)}%</b> vs this month’s target</>}</div>
      </div>
      <div className="cell">
        <div className="cell-head"><StatGoal className="i acc" />Progress to {money(goal)}</div>
        <div className="cell-n">{rev != null ? Math.round(rev / goal * 100) : 0}%</div>
        <div className="cell-note">{rev != null ? <><b>{money(Math.max(0, goal - rev))}</b> a month still to grow</> : 'Set a revenue KPI for the founder'}</div>
      </div>
      <div className="cell">
        <div className="cell-head"><StatPeople className="i acc" />People on track
          <button className="go" aria-label="Go to People and KPIs" onClick={() => scrollToSection('sec-people')}><IconArrow /></button></div>
        <div className="cell-n">{on}<small>/{state.people.length}</small></div>
        <div className="cell-note">{off ? <><b className="s-behind">{off} off track</b> this month</> : <b className="s-on">Everyone is hitting their KPI</b>}</div>
      </div>
      <div className="cell">
        <div className="cell-head"><StatDepts className="i acc" />Departments on track
          <button className="go" aria-label="Go to department health" onClick={() => scrollToSection('sec-depts')}><IconArrow /></button></div>
        <div className="cell-n">{clear}<small>/{ds.length}</small></div>
        <div className="cell-note">{worstD ? <><b className={`s-${worstD.status}`}>{worstD.d}</b> is {STATUS_LABEL[worstD.status].toLowerCase()}</> : <b className="s-on">All clear</b>}</div>
      </div>
    </section>
  );
}
