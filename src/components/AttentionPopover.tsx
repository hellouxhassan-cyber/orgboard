import { useEffect, useRef, useState } from 'react';
import { gapText, offList, ownStatus, STATUS_LABEL } from '../domain/performance';
import { useStore } from '../state/context';
import { Avatar } from './Avatar';
import { IconBell } from './Icons';

/** The faces of whoever is off track sit in the top bar. Clicking them, or the bell, lists who needs attention. */
export function AttentionPopover({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const off = offList(state);
  const label = off.length ? `${off.length} ${off.length === 1 ? 'person' : 'people'} off track` : 'Everyone on track';

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc, true); };
  }, [open]);

  return (
    <div ref={ref} className="att-wrap">
      {off.length > 0 && (
        <button className="stack" aria-label={`${label}. Show who`} aria-expanded={open} onClick={() => setOpen(!open)}>
          {off.slice(0, 3).map(p => <Avatar key={p.id} name={p.name} dept={p.dept} size={30} />)}
          {off.length > 3 && <span className="av more-av">+{off.length - 3}</span>}
        </button>
      )}
      <button className="ibtn" aria-haspopup="true" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>
        <IconBell />{off.length > 0 && <span className="badge" />}
      </button>
      {open && (
        <div className="pop">
          <div className="pop-head">
            {off.length ? `${off.length} ${off.length === 1 ? 'person is' : 'people are'} off track` : 'Everyone is on track'}
            <small>{off.length ? 'Below target this month, worst first' : 'Nobody is below target this month'}</small>
          </div>
          {off.map(p => {
            const s = ownStatus(p);
            return (
              <button key={p.id} className="li" onClick={() => { setOpen(false); onOpen(p.id); }}>
                <Avatar name={p.name} dept={p.dept} size={28} />
                <span><b>{p.name}</b><small>{p.kpi.name}: {gapText(p)}</small></span>
                <span className={`tag ${s}`}>{STATUS_LABEL[s]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
