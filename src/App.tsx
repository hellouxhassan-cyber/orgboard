import { useCallback, useEffect, useRef } from 'react';
import { byId, treeOrder } from './domain/org';
import { StoreContext } from './state/context';
import { isWide, reveal } from './state/dom';
import { keepSet } from './state/selectors';
import { useOrgStore } from './state/store';
import { DepartmentChart } from './components/DepartmentChart';
import { DetailPanel } from './components/DetailPanel';
import { Header } from './components/Header';
import { NeedsAttention } from './components/NeedsAttention';
import { OrgChart } from './components/OrgChart';
import { PeopleTable } from './components/PeopleTable';
import { Sidebar } from './components/Sidebar';
import { StatCards } from './components/StatCards';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { PhoneFooter } from './components/PhoneFooter';

export default function App() {
  const store = useOrgStore();
  const { state, ui, patchUi, flash } = store;
  const searchRef = useRef<HTMLInputElement>(null);

  // Remember what opened the panel so closing it can hand keyboard focus back.
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback((id: string) => {
    if (!byId(state, id)) return;
    const a = document.activeElement as HTMLElement | null;
    if (!a?.closest('.sheet')) opener.current = a;
    patchUi({ selected: id });
    requestAnimationFrame(() => reveal(id, true));
  }, [state, patchUi]);
  const close = useCallback(() => {
    const id = ui.selected;
    patchUi({ selected: null });
    requestAnimationFrame(() => {
      const back = opener.current?.isConnected ? opener.current : id ? document.querySelector<HTMLElement>(`[data-card="${id}"]`) : null;
      back?.focus({ preventScroll: true });
      opener.current = null;
    });
  }, [patchUi, ui.selected]);

  // On phones the panel covers the screen, so the page behind it is taken out of the tab order.
  useEffect(() => {
    const app = document.querySelector('.app');
    if (!app) return;
    const sync = () => { if (ui.selected && !isWide()) app.setAttribute('inert', ''); else app.removeAttribute('inert'); };
    sync();
    window.addEventListener('resize', sync);
    return () => { window.removeEventListener('resize', sync); app.removeAttribute('inert'); };
  }, [ui.selected]);

  // Keep a flashed card (just moved or added) in view.
  useEffect(() => { if (flash) requestAnimationFrame(() => reveal(flash.id, !!ui.selected)); }, [flash]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: "/" focuses search, Enter in search opens the first match, Esc clears search or closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = !!el.closest('input,textarea,select');
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === 'Escape') {
        if (el === searchRef.current && ui.query) { patchUi({ query: '' }); return; }
        if (ui.selected) close();
      }
      if (e.key === 'Enter' && el === searchRef.current) {
        const keep = keepSet(state, { ...ui, hoverId: null });
        const first = keep && treeOrder(state).find(({ p }) => keep.has(p.id));
        if (first) open(first.p.id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, ui, patchUi, open, close]);

  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <Sidebar searchRef={searchRef} />
        <main className="main">
          <TabBar onOpen={open} />
          <div className="panel">
            <Header />
            <div className="p-body">
              <StatCards onOpen={open} />
              <OrgChart onOpen={open} />
              <div className="duo" id="sec-depts">
                <DepartmentChart />
                <NeedsAttention onOpen={open} />
              </div>
              <PeopleTable onOpen={open} />
              <PhoneFooter />
            </div>
          </div>
        </main>
      </div>
      <DetailPanel onOpen={open} onClose={close} />
      <Toast />
    </StoreContext.Provider>
  );
}
