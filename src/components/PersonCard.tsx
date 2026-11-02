import type { DragEvent } from 'react';
import { fmt, ownLabel, ownStatus, progressPct, teamClass, teamStatus, teamText } from '../domain/performance';
import type { OrgState, Person } from '../domain/types';
import { Avatar } from './Avatar';

interface Props {
  s: OrgState; p: Person; x: number; y: number;
  selected: boolean; faded: boolean; flash: boolean; dragging: boolean; dropTarget: boolean;
  onOpen: () => void; onHover: (on: boolean) => void;
  onDragStart: (e: DragEvent) => void; onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void; onDragLeave: (e: DragEvent) => void; onDrop: (e: DragEvent) => void;
}

/** One person on the org chart: who they are, what they own, and their own and team status side by side. */
export function PersonCard(props: Props) {
  const { s, p, x, y } = props;
  const st = ownStatus(p), t = teamStatus(s, p), k = p.kpi;
  const cls = ['card', props.selected && 'sel', props.faded && 'fade', props.flash && 'flash', props.dragging && 'dragging', props.dropTarget && 'drop'].filter(Boolean).join(' ');
  return (
    <div
      className={cls} data-card={p.id} style={{ left: x, top: y }} tabIndex={0} role="button"
      draggable={!!p.managerId}
      aria-label={`${p.name}, ${p.title}. Own KPI ${ownLabel(p)}.${t ? ` Team ${teamText(t)}.` : ''}`}
      onClick={props.onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onOpen(); } }}
      onMouseEnter={() => props.onHover(true)} onMouseLeave={() => props.onHover(false)}
      onDragStart={props.onDragStart} onDragEnd={props.onDragEnd}
      onDragOver={props.onDragOver} onDragLeave={props.onDragLeave} onDrop={props.onDrop}
    >
      <div className="c-head"><Avatar name={p.name} dept={p.dept} /><div className="c-who"><div className="c-name" title={p.name}>{p.name}</div><div className="c-title" title={p.title}>{p.title}</div></div></div>
      <div className="c-kpi">
        <div className="c-kpi-row"><span className="c-kpi-label" title={k.name || undefined}>{k.name || 'No KPI yet'}</span><span className="c-kpi-val">{fmt(k.current, k.unit)}<span className="of"> / {fmt(k.target, k.unit)}</span></span></div>
        <div className={`bar s-${st}`}><i style={{ width: `${progressPct(p)}%` }} /></div>
      </div>
      <div className={`c-sig${t ? '' : ' solo'}`}>
        <div><span className="lbl">Own</span><span className={`st s-${st}`}><i className="dot" />{ownLabel(p)}</span></div>
        {t && <div><span className="lbl">Team of {t.total}</span><span className={`st s-${teamClass(t)}`}><i className="dot" />{teamText(t)}</span></div>}
      </div>
    </div>
  );
}
