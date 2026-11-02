import { useEffect, useRef, useState } from 'react';
import { byId, chain, children, departments, descendants, matchDepartment, treeOrder } from '../domain/org';
import { firstName, fmt, gapText, ownLabel, ownStatus, progressPct, RANK, STATUS_LABEL, stepFor, teamClass, teamStatus, teamText } from '../domain/performance';
import type { Severity, Unit } from '../domain/types';
import { useStore } from '../state/context';
import { afterAdd } from '../state/dom';
import { IconClose } from './Icons';
import { Avatar } from './Avatar';
import { NumberField } from './NumberField';

const UNITS: [Unit, string][] = [['number', 'Count'], ['currency', 'Dollars'], ['percent', 'Percent'], ['ratio', 'Multiple (×)'], ['day', 'Day of month']];

/** Slides over from the right. Ordered from what a founder looks at most (status) to what they change least (role). */
export function DetailPanel({ onOpen, onClose }: { onOpen: (id: string) => void; onClose: () => void }) {
  const { state, ui, actions } = useStore();
  const p = byId(state, ui.selected);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const [lastId, setLastId] = useState<string | undefined>(p?.id);
  const [deptDraft, setDeptDraft] = useState<string | null>(null);

  useEffect(() => { setConfirmDelete(false); setDeptDraft(null); if (p?.id !== lastId) { bodyRef.current?.scrollTo({ top: 0 }); setLastId(p?.id); } }, [p?.id, lastId]);

  // When a person opens, move keyboard focus into the panel, unless the cursor is already in one of its fields.
  useEffect(() => {
    if (!p?.id) return;
    requestAnimationFrame(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a?.closest('.sheet')) headRef.current?.focus({ preventScroll: true });
    });
  }, [p?.id]);

  if (!p) return <aside className="sheet" aria-label="Person details" aria-hidden="true" />;

  const k = p.kpi, s = ownStatus(p), t = teamStatus(state, p), isRoot = !p.managerId;
  const banned = new Set([p.id, ...descendants(state, p.id).map(x => x.id)]);
  const reports = children(state, p.id);
  const via = (id: string) => {
    const c = chain(state, byId(state, id)!); const i = c.findIndex(m => m.id === p.id); const mid = c.slice(i + 1);
    return mid.length ? 'via ' + mid.map(m => firstName(m.name)).join(', ') : 'direct report';
  };
  const setCurrent = (v: number | null) => actions.updateKpi(p.id, { current: v });

  return (
    <aside className="sheet open" aria-label="Person details">
      <div className="sh-head">
        <Avatar name={p.name} dept={p.dept} size={34} />
        <div style={{ minWidth: 0 }}><h2 ref={headRef} tabIndex={-1}>{p.name}</h2><p>{p.title} · {p.dept}</p></div>
        <button className="ibtn" aria-label="Close" onClick={onClose}><IconClose /></button>
      </div>
      <div className="sh-body" ref={bodyRef}>
        {!isRoot && (
          <nav className="trail" aria-label="Reports through">
            {chain(state, p).map(x => <span key={x.id} style={{ display: 'contents' }}><button onClick={() => onOpen(x.id)}>{x.name}</button><span aria-hidden="true">/</span></span>)}
            <span className="now">{p.name}</span>
          </nav>
        )}

        <div className="sec">
          <div className={`signals${t ? '' : ' solo'}`}>
            <div className="sig"><span className="lbl">Own KPI</span><span><span className={`tag ${s}`}>{ownLabel(p)}</span></span><small>{gapText(p)}</small></div>
            {t && <div className="sig"><span className="lbl">Team of {t.total}</span><span><span className={`tag ${teamClass(t)}`}>{teamText(t)}</span></span><small>{t.onCount} of {t.total} hitting their KPI{t.none.length ? `, ${t.none.length} not measured yet` : ''}</small></div>}
          </div>
        </div>

        <div className="sec">
          <h3>{k.name || 'No KPI yet'}</h3>
          {p.outcome && <p className="subt">{p.outcome}</p>}
          <div className="big"><span className="n">{fmt(k.current, k.unit)}</span><span className="of">of {fmt(k.target, k.unit)} target{k.dir === 'lower' ? ', lower is better' : ''}</span></div>
          <div className={`bar lg s-${s}`}><i style={{ width: `${progressPct(p)}%` }} /></div>
        </div>

        <div className="sec">
          <h3>Update this month</h3>
          <div className="stepper">
            <button className="sq" aria-label="Decrease" disabled={!k.name} onClick={() => setCurrent(Math.max(k.unit === 'day' ? 1 : 0, +(((k.current ?? 0) - stepFor(k.unit, k.target))).toFixed(4)))}>−</button>
            <NumberField id="f-current" block value={k.current} unit={k.unit} label="Current number" disabled={!k.name} onChange={setCurrent} />
            <button className="sq" aria-label="Increase" disabled={!k.name} onClick={() => setCurrent(k.unit === 'day' ? Math.min(31, (k.current ?? 0) + 1) : +(((k.current ?? 0) + stepFor(k.unit, k.target))).toFixed(4))}>+</button>
          </div>
          <div className="row-f between">
            <button className="btn sm" disabled={!k.name || k.target == null} onClick={() => setCurrent(k.target)}>Set to target</button>
            <p className="hint">{k.name ? 'The whole org updates as you type' : 'Give this role a KPI below first'}</p>
          </div>
        </div>

        {t && (
          <div className="sec">
            <h3>Team</h3>
            <p className="subt">{t.off.length ? `Who is pulling ${firstName(p.name)}’s team below target.` : `Everyone below ${firstName(p.name)} is hitting their number.`}</p>
            {t.off.length > 0 && (
              <div className="list">
                {[...t.off].sort((a, b) => RANK[ownStatus(b) as Severity] - RANK[ownStatus(a) as Severity]).map(x => (
                  <button key={x.id} className="li" onClick={() => onOpen(x.id)}>
                    <Avatar name={x.name} dept={x.dept} size={26} />
                    <span><b>{x.name}</b><small>{gapText(x)}, {via(x.id)}</small></span>
                    <span className={`tag ${ownStatus(x)}`}>{STATUS_LABEL[ownStatus(x)]}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="subt" style={{ margin: '4px 0 0' }}>Direct reports</p>
            <div className="list">
              {reports.map(x => {
                const xt = teamStatus(state, x), xo = ownStatus(x);
                const issue = !!xt && xt.off.length > 0 && xo === 'on';
                return (
                  <button key={x.id} className="li" onClick={() => onOpen(x.id)}>
                    <Avatar name={x.name} dept={x.dept} size={26} />
                    <span><b>{x.name}</b><small>{x.title}{xt ? `, team of ${xt.total}` : ''}</small></span>
                    <span className={`st s-${issue ? xt!.status : xo}`} style={{ fontSize: 12.5 }}><i className="dot" />{issue ? `Team: ${xt!.off.length} off track` : ownLabel(x)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="sec">
          <h3>Ownership</h3>
          <div className="field"><label htmlFor="f-outcome">Outcome this role owns</label>
            <textarea className="in" id="f-outcome" placeholder="The one result this person is accountable for" value={p.outcome} onChange={e => actions.updatePerson(p.id, { outcome: e.target.value })} /></div>
          <div className="field"><label htmlFor="f-kname">KPI</label>
            <input className="in" id="f-kname" placeholder="For example, winning ads per month" value={k.name} onChange={e => actions.updateKpi(p.id, { name: e.target.value })} /></div>
          <div className="fields-2">
            <div className="field"><label htmlFor="f-unit">Measured in</label>
              <select className="in" id="f-unit" value={k.unit} onChange={e => actions.updateKpi(p.id, { unit: e.target.value as Unit })}>
                {UNITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="field"><label htmlFor="f-target">Target</label>
              <NumberField id="f-target" value={k.target} unit={k.unit} label="Target" onChange={v => actions.updateKpi(p.id, { target: v })} /></div>
          </div>
          <div className="field"><span style={{ fontSize: 13, color: 'var(--muted)' }}>A good result is</span>
            <div className="seg" role="group" aria-label="A good result is">
              <button aria-pressed={k.dir !== 'lower'} onClick={() => actions.updateKpi(p.id, { dir: 'higher' })}>Above target</button>
              <button aria-pressed={k.dir === 'lower'} onClick={() => actions.updateKpi(p.id, { dir: 'lower' })}>Below target</button>
            </div>
          </div>
        </div>

        <div className="sec">
          <h3>Role</h3>
          <div className="fields-2">
            <div className="field"><label htmlFor="f-name">Name</label>
              <input className="in" id="f-name" value={p.name} onChange={e => actions.updatePerson(p.id, { name: e.target.value })}
                onBlur={e => { if (!e.target.value.trim()) actions.updatePerson(p.id, { name: 'Unnamed' }); }} /></div>
            <div className="field"><label htmlFor="f-title">Title</label>
              <input className="in" id="f-title" value={p.title} onChange={e => actions.updatePerson(p.id, { title: e.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor="f-dept">Department</label>
            <input className="in" id="f-dept" list="deptList" value={deptDraft ?? p.dept}
              onFocus={() => setDeptDraft(p.dept)}
              onChange={e => setDeptDraft(e.target.value)}
              onBlur={() => {
                // Commit once, on leaving the field: trimmed, matched to an existing department ignoring case, never empty.
                const next = matchDepartment(state, deptDraft ?? '');
                if (next && next !== p.dept) actions.updatePerson(p.id, { dept: next });
                setDeptDraft(null);
              }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDeptDraft(null); } }} />
            <datalist id="deptList">{departments(state).map(d => <option key={d} value={d} />)}</datalist></div>
          {isRoot ? <p className="hint">Top of the company. Every number rolls up here.</p> : (
            <div className="field"><label htmlFor="f-mgr">Reports to</label>
              <select className="in" id="f-mgr" value={p.managerId ?? ''} onChange={e => actions.reparent(state, p.id, e.target.value)}>
                {treeOrder(state).filter(({ p: x }) => !banned.has(x.id)).map(({ p: x, d }) => (
                  <option key={x.id} value={x.id}>{'   '.repeat(d)}{x.name}, {x.title}</option>
                ))}
              </select></div>
          )}
        </div>

        <div className="sh-foot">
          <div className="row-f">
            <button className="btn sm" onClick={() => { actions.addReport(state, p.id); afterAdd(); }}>Add direct report</button>
            {!isRoot && <button className="btn sm danger" onClick={() => setConfirmDelete(true)}>Remove role</button>}
          </div>
          {confirmDelete && !isRoot && (
            <div className="confirm" role="alertdialog" aria-label="Confirm remove">
              <span>Remove {p.name} from the org?{reports.length ? ` Their ${reports.length} direct report${reports.length > 1 ? 's' : ''} will move up to ${byId(state, p.managerId)!.name}.` : ''}</span>
              <div className="row-f">
                <button className="btn sm danger-solid" onClick={() => actions.removeRole(state, p.id)}>Remove</button>
                <button className="btn sm" onClick={() => setConfirmDelete(false)}>Keep</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
