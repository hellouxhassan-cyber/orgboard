import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { layoutOrg } from '../domain/layout';
import { byId, canReparent, treeOrder } from '../domain/org';
import { lineSeverity, RANK } from '../domain/performance';
import { useStore } from '../state/context';
import { isWide, PANEL_W } from '../state/dom';
import { keepSet } from '../state/selectors';
import { PersonCard } from './PersonCard';

const LINE = { on: '#D6D6D6', risk: '#E7B455', behind: '#EC7D80' } as const;

export function OrgChart({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, ui, patchUi, actions, flash } = useStore();
  const layout = useMemo(() => layoutOrg(state), [state]);
  const keep = useMemo(() => keepSet(state, ui), [state, ui]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const pan = useRef<{ x: number; l: number } | null>(null);
  const [panning, setPanning] = useState(false);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el); setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Fit the chart to the card width, but never shrink text below 80%. Beyond that the canvas scrolls.
  const scale = width ? Math.max(0.8, Math.min(1, (width - 48) / layout.width)) : 1;
  const panelPad = ui.selected && isWide() ? PANEL_W : 0;

  const links = useMemo(() => layout.links
    .map(l => ({ ...l, sev: lineSeverity(state, byId(state, l.child)!) }))
    .sort((a, b) => RANK[a.sev] - RANK[b.sev]), [layout, state]);

  useEffect(() => {
    const move = (e: PointerEvent) => { if (pan.current && scrollRef.current) scrollRef.current.scrollLeft = pan.current.l - (e.clientX - pan.current.x); };
    const up = () => { pan.current = null; setPanning(false); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
  }, []);

  const canDrop = (id: string) => !!dragId && canReparent(state, dragId, id);

  return (
    <section className="box chart-box" id="sec-chart" aria-label="Org chart">
      <div className="box-head">
        <div><h2>Org chart</h2><p>Who reports to whom, what each person owns, and how every number rolls up.</p></div>
        <span className="keys" style={{ fontSize: 13, paddingTop: 4 }}>
          <span><b style={{ fontWeight: 500 }}>Own</b><em>their KPI</em></span>
          <span><b style={{ fontWeight: 500 }}>Team</b><em>everyone below them</em></span>
        </span>
      </div>
      <div
        className={`chart-scroll${panning ? ' panning' : ''}`} id="chart-scroll" ref={scrollRef}
        onPointerDown={e => {
          if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('[data-card]')) return;
          pan.current = { x: e.clientX, l: scrollRef.current!.scrollLeft }; setPanning(true);
        }}
      >
        <div className="chart-track" style={{ paddingRight: 24 + panelPad }}>
          <div className="chart-sizer" style={{ width: Math.ceil(layout.width * scale), height: Math.ceil(layout.height * scale) }}>
            <div className={`chart-inner${keep ? ' dim' : ''}`} style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}>
              <svg className="lines" width={layout.width} height={layout.height} aria-hidden="true">
                {links.map(l => (
                  <path key={l.child} d={l.d} stroke={LINE[l.sev]} strokeWidth={l.sev === 'on' ? 1.25 : 1.75}
                    className={keep && !(keep.has(l.child) && keep.has(l.manager)) ? 'fade' : undefined} />
                ))}
              </svg>
              <div>
                {treeOrder(state).map(({ p }) => {
                  const at = layout.pos[p.id];
                  if (!at) return null;
                  const isFlash = flash?.id === p.id;
                  return (
                    <PersonCard
                      key={isFlash ? `${p.id}-${flash!.n}` : p.id} s={state} p={p} x={at.x} y={at.y}
                      selected={ui.selected === p.id} faded={!!keep && !keep.has(p.id)} flash={isFlash}
                      dragging={dragId === p.id} dropTarget={dropId === p.id}
                      onOpen={() => onOpen(p.id)}
                      onHover={on => { if (!dragId) patchUi({ hoverId: on ? p.id : null }); }}
                      onDragStart={e => { setDragId(p.id); patchUi({ hoverId: null }); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', p.id); } catch { /* some browsers */ } }}
                      onDragEnd={() => { setDragId(null); setDropId(null); }}
                      onDragOver={e => { if (canDrop(p.id)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropId(p.id); } }}
                      onDragLeave={e => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropId(d => (d === p.id ? null : d)); }}
                      onDrop={e => { if (canDrop(p.id)) { e.preventDefault(); const id = dragId!; setDragId(null); setDropId(null); actions.reparent(state, id, p.id); } }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {keep && keep.size === 0 && !ui.hoverId && (
        <div className="chart-empty" role="status">
          <span>No one matches these filters</span>
          <button className="linkish" onClick={() => patchUi({ query: '', dept: null, mode: 'all' })}>Clear filters</button>
        </div>
      )}
      <div className="chart-foot">
        <div className="keys">
          <span><i className="dot s-on" />On track<em>100%+</em></span>
          <span><i className="dot s-risk" />At risk<em>85 to 99%</em></span>
          <span><i className="dot s-behind" />Behind<em>under 85%</em></span>
        </div>
        <span>Click a person to edit. Drag them onto someone, or use Reports to in the panel, to change their manager.</span>
      </div>
    </section>
  );
}
