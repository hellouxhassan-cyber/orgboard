import { useEffect, useState } from 'react';
import { useStore } from '../state/context';
import { afterAdd, scrollToSection } from '../state/dom';
import { AttentionPopover } from './AttentionPopover';
import { IconChart, IconOrg, IconTable } from './Icons';

const TABS = [
  { id: 'sec-chart', label: 'Org chart', short: 'Chart', Icon: IconOrg },
  { id: 'sec-depts', label: 'Departments', short: 'Depts', Icon: IconChart },
  { id: 'sec-people', label: 'People & KPIs', short: 'People', Icon: IconTable }
];

export function TabBar({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, ui, save, actions } = useStore();
  const [active, setActive] = useState('sec-chart');

  // The active tab follows whichever section is in the middle of the screen.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) setActive(en.target.id); }), { rootMargin: '-40% 0px -55% 0px' });
    TABS.forEach(t => { const el = document.getElementById(t.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <div className="tabbar">
      <nav className="tabs" aria-label="Sections">
        {TABS.map(({ id, label, short, Icon }) => (
          <button key={id} className="tab" aria-current={active === id} aria-label={label} onClick={() => scrollToSection(id)}><Icon /><span className="t-long">{label}</span><span className="t-short" aria-hidden="true">{short}</span></button>
        ))}
      </nav>
      <div className="tb-right">
        <span className="saved" aria-live="polite">{save === 'saving' ? 'Saving…' : save === 'blocked' ? 'This browser is blocking saves' : 'All changes saved'}</span>
        <AttentionPopover onOpen={onOpen} />
        <span className="vsep" aria-hidden="true" />
        <button className="btn accent" onClick={() => { actions.addReport(state, ui.selected); afterAdd(); }}>Add role</button>
      </div>
    </div>
  );
}
