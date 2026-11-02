import { chain } from '../domain/org';
import { firstName, gapText, hiddenProblems, offList, ownStatus, STATUS_LABEL, teamStatus } from '../domain/performance';
import { useStore } from '../state/context';
import { Avatar } from './Avatar';

export function NeedsAttention({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const off = offList(state);
  const hidden = hiddenProblems(state);
  return (
    <section className="box" aria-label="Needs attention">
      <div className="box-head"><div><h2>Needs attention</h2><p>Who is off track, and which managers it affects.</p></div></div>
      <div className="alist">
        <div className="group-t">Off track</div>
        {off.length ? off.map(p => {
          const s = ownStatus(p), c = chain(state, p);
          return (
            <button key={p.id} className="arow" onClick={() => onOpen(p.id)}>
              <Avatar name={p.name} dept={p.dept} />
              <span><b>{p.name}</b><small>{p.kpi.name}: {gapText(p)}</small>
                <small className="path">Reports through {c.length ? c.map(x => firstName(x.name)).join(' / ') : 'nobody'}</small></span>
              <span className={`tag ${s}`}>{STATUS_LABEL[s]}</span>
            </button>
          );
        }) : <div className="empty">Everyone is hitting their KPI this month.</div>}
        <div className="group-t">Managers whose own number hides a team problem</div>
        {hidden.length ? hidden.map(p => {
          const t = teamStatus(state, p)!;
          return (
            <button key={p.id} className="arow" onClick={() => onOpen(p.id)}>
              <Avatar name={p.name} dept={p.dept} />
              <span><b>{p.name}</b><small>Own KPI on track. Team has {t.off.map(x => firstName(x.name)).join(', ')} off track</small></span>
              <span className={`tag ${t.status}`}>{t.off.length} off track</span>
            </button>
          );
        }) : <div className="empty">No manager is carrying a hidden problem.</div>}
      </div>
    </section>
  );
}
