import { departments } from '../domain/org';
import { deptStats, STATUS_LABEL } from '../domain/performance';
import { useStore } from '../state/context';
import { DeptIcon } from './Icons';

const MAX = 1.25;
const TARGET = `${100 / MAX}%`;

/**
 * Average KPI score per department as horizontal bars, drawn to scale (0 to 125%), with a dashed
 * mark at 100% of target. The bar is tinted by the department's status, so a department with
 * someone off track never looks fully fine even when its average reaches the target.
 * Clicking a row spotlights that department.
 */
export function DepartmentChart() {
  const { state, ui, patchUi } = useStore();
  const ds = departments(state).map(d => ({ d, ...deptStats(state, d) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return (
    <section className="box" aria-label="Department health">
      <div className="box-head"><div><h2>Department health</h2><p>Average KPI score per department, best first. The dashed mark is 100% of target, and the bar color shows whether anyone inside is off track.</p></div></div>
      <div className="hbars">
        {ds.map(x => {
          const w = x.score == null ? 0 : Math.min(x.score, MAX) / MAX * 100;
          const label = x.score == null ? '–' : `${Math.round(x.score * 100)}%`;
          const off = x.members.length - x.on;
          return (
            <button key={x.d} className={`hrow st-${x.status}`} aria-pressed={ui.dept === x.d}
              aria-label={`${x.d}: average score ${x.score == null ? 'not set' : label}, ${STATUS_LABEL[x.status]}, ${x.on} of ${x.members.length} on track`}
              onClick={() => patchUi({ dept: ui.dept === x.d ? null : x.d })}>
              <span className="htrack">
                <span className="hfill" style={{ width: `${w}%` }} />
                <i className="htarget" style={{ left: TARGET }} />
                <span className="hname"><DeptIcon dept={x.d} />{x.d}</span>
              </span>
              <span className="hstat">
                <b>{label}</b>
                <span className={`s-${x.status}`}><i className="dot" />{off > 0 && x.status !== 'on' ? `${off} off track` : `${x.on}/${x.members.length} on track`}</span>
              </span>
            </button>
          );
        })}
        <div className="haxis" aria-hidden="true">
          <span className="ax-track"><span style={{ left: 0 }}>0%</span><span className="ax-mid" style={{ left: '40%' }}>50%</span><span style={{ left: TARGET }}>100%</span><span className="ax-end" style={{ left: '100%' }}>125%</span></span><span />
        </div>
      </div>
    </section>
  );
}
