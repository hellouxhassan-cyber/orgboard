import { useState } from 'react';
import { departments, root } from '../domain/org';
import { deptStats, offList } from '../domain/performance';
import { useStore } from '../state/context';
import { Avatar } from './Avatar';
import { DeptIcon, IconEveryone, IconOrg, IconReset, IconSearch, IconWarning } from './Icons';

export function Sidebar({ searchRef }: { searchRef: React.RefObject<HTMLInputElement> }) {
  const { state, ui, patchUi, actions } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const off = offList(state).length;
  const founder = root(state);

  return (
    <aside className="side" aria-label="Workspace">
      <div className="ws">
        <span className="brand-mark"><IconOrg className="i" /></span>
        <b>{state.company.name}</b>
      </div>

      <div className="side-body">
        <label className="search">
          <IconSearch />
          <input ref={searchRef} type="search" placeholder="Find a person" autoComplete="off" aria-label="Find a person"
            value={ui.query} onChange={e => patchUi({ query: e.target.value })} />
          <kbd>/</kbd>
        </label>

        <nav className="nav" aria-label="Departments">
          <span className="nav-label">Departments</span>
          <button className="nav-item" aria-pressed={!ui.dept} onClick={() => patchUi({ dept: null })}>
            <IconEveryone />Everyone<span className="cnt">{state.people.length}</span>
          </button>
          {departments(state).map(d => {
            const s = deptStats(state, d);
            return (
              <button key={d} className="nav-item" aria-pressed={ui.dept === d} onClick={() => patchUi({ dept: ui.dept === d ? null : d })}
                aria-label={`${d}, ${s.on} of ${s.members.length} on track`}>
                <DeptIcon dept={d} />{d}
                <span className="cnt"><i className={`dot s-${s.status}`} />{s.on}/{s.members.length}</span>
              </button>
            );
          })}
          <span className="nav-label" style={{ marginTop: 14 }}>Focus</span>
          <button className="nav-item" aria-pressed={ui.mode === 'off'} onClick={() => patchUi({ mode: ui.mode === 'off' ? 'all' : 'off' })}>
            <IconWarning />Off track only<span className="cnt">{off || ''}</span>
          </button>
        </nav>
      </div>

      <div className="side-foot">
        {confirmReset ? (
          <div className="reset-confirm" role="group" aria-label="Confirm reset">
            <p>Restore the sample company? Your changes will be replaced.</p>
            <div className="row-f">
              <button className="btn sm danger" onClick={() => { actions.reset(); setConfirmReset(false); }}>Restore</button>
              <button className="btn sm" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="nav-item" onClick={() => setConfirmReset(true)}><IconReset />Reset sample data</button>
        )}
        {founder && (
          <div className="me">
            <Avatar name={founder.name} dept={founder.dept} size={30} />
            <div><b>{founder.name}</b><span>{founder.title}</span></div>
          </div>
        )}
      </div>
    </aside>
  );
}
