import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addReport, byId, canReparent, departments, removeRole, reparent, repair, root } from '../domain/org';
import { cloneSeed } from '../domain/seed';
import type { Kpi, OrgState, Person } from '../domain/types';

export const STORE_KEY = 'orgboard.halden.v2';
const PREFS_KEY = 'orgboard.prefs.v3';

export type Mode = 'all' | 'off';
export type SortKey = 'org' | 'name' | 'progress' | 'team' | 'mgr';

export interface UiState {
  mode: Mode;
  dept: string | null;
  query: string;
  selected: string | null;
  hoverId: string | null;
  deptsOpen: boolean;
  sort: { key: SortKey; dir: 1 | -1 };
}

function loadState(): OrgState {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (d && d.v === 2) { const fixed = repair(d); if (fixed) return fixed; }
  } catch { /* storage blocked or corrupt: fall back to the sample company */ }
  return cloneSeed();
}
function loadPrefs(): Partial<UiState> {
  try {
    const u = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (u) return { mode: u.mode === 'off' ? 'off' : 'all', deptsOpen: u.deptsOpen !== false };
  } catch { /* ignore */ }
  return {};
}

export type SaveStatus = 'saved' | 'saving' | 'blocked';

export function useOrgStore() {
  const [state, setState] = useState<OrgState>(loadState);
  const [ui, setUi] = useState<UiState>(() => ({
    mode: 'all', dept: null, query: '', selected: null, hoverId: null, deptsOpen: true,
    sort: { key: 'org', dir: 1 }, ...loadPrefs()
  }));
  const [save, setSave] = useState<SaveStatus>('saved');
  const [toast, setToast] = useState<{ msg: string; undo: boolean; n: number } | null>(null);
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const undoRef = useRef<OrgState | null>(null);
  const first = useRef(true);

  // Persist after every change, debounced so typing stays smooth.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSave('saving');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        localStorage.setItem(PREFS_KEY, JSON.stringify({ mode: ui.mode, deptsOpen: ui.deptsOpen }));
        setSave('saved');
      } catch { setSave('blocked'); }
    }, 300);
    return () => clearTimeout(t);
  }, [state, ui.mode, ui.deptsOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const patchUi = useCallback((p: Partial<UiState>) => setUi(u => ({ ...u, ...p })), []);

  // A department filter that no longer exists (renamed or emptied) would silently hide everyone. Drop it.
  useEffect(() => {
    if (ui.dept && !departments(state).includes(ui.dept)) setUi(u => ({ ...u, dept: null }));
  }, [state, ui.dept]);

  /** Any edit that is not itself undoable ends the chance to undo the last structural change. */
  const endUndo = useCallback(() => {
    if (!undoRef.current) return;
    undoRef.current = null;
    setToast(t => (t ? { ...t, undo: false } : t));
  }, []);

  /** A structural change: snapshot for undo, apply, and tell the user. */
  const commit = useCallback((next: OrgState, msg: string, flashId?: string) => {
    setState(prev => { undoRef.current = prev; return next; });
    setToast(t => ({ msg, undo: true, n: (t?.n ?? 0) + 1 }));
    if (flashId) setFlash(f => ({ id: flashId, n: (f?.n ?? 0) + 1 }));
  }, []);

  const actions = useMemo(() => ({
    updatePerson(id: string, patch: Partial<Omit<Person, 'kpi'>>) {
      endUndo();
      setState(s => ({ ...s, people: s.people.map(p => (p.id === id ? { ...p, ...patch } : p)) }));
    },
    updateKpi(id: string, patch: Partial<Kpi>) {
      endUndo();
      setState(s => ({ ...s, people: s.people.map(p => (p.id === id ? { ...p, kpi: { ...p.kpi, ...patch } } : p)) }));
    },
    reparent(s: OrgState, id: string, managerId: string) {
      if (!canReparent(s, id, managerId)) return;
      commit(reparent(s, id, managerId), `${byId(s, id)!.name} now reports to ${byId(s, managerId)!.name}`, id);
    },
    /** Adds a role under a manager. From the top bar (no manager chosen) it lands under the founder in "Unassigned". */
    addReport(s: OrgState, managerId: string | null) {
      const chosen = byId(s, managerId);
      const m = chosen ?? root(s);
      if (!m) return;
      const id = 'p' + Date.now().toString(36);
      commit(addReport(s, m.id, id, chosen ? undefined : 'Unassigned'), `Added a role under ${m.name}`, id);
      setUi(u => ({ ...u, selected: id, mode: 'all', dept: null, query: '' }));
      return id;
    },
    removeRole(s: OrgState, id: string) {
      const p = byId(s, id);
      if (!p || !p.managerId) return;
      commit(removeRole(s, id), `Removed ${p.name}`);
      setUi(u => ({ ...u, selected: null }));
    },
    reset() {
      commit(cloneSeed(), 'Sample company restored');
      setUi(u => ({ ...u, selected: null, mode: 'all', dept: null, query: '', hoverId: null }));
    },
    undo() {
      const prev = undoRef.current;
      if (!prev) return;
      undoRef.current = null;
      setState(prev);
      setToast(null);
      setUi(u => ({ ...u, selected: u.selected && byId(prev, u.selected) ? u.selected : null }));
    }
  }), [commit, endUndo]);

  return { state, ui, patchUi, actions, save, toast, flash, hasUndo: () => !!undoRef.current };
}

export type Store = ReturnType<typeof useOrgStore>;
