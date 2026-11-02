import { departments } from '../domain/org';
import { monthName, offList } from '../domain/performance';
import { useStore } from '../state/context';
import { IconFilter, IconSearch, IconSort } from './Icons';

export function Header() {
  const { state, ui, patchUi } = useStore();
  const off = offList(state).length;
  const month = monthName();
  return (
    <>
      <div className="p-head">
        <h1>Overview</h1>
        <span className="p-flag">
          <i className={`dot ${off ? 's-behind' : 's-on'}`} />
          {off ? `${off} ${off === 1 ? 'person' : 'people'} off track in ${month}` : `Everyone on track in ${month}`}
        </span>
      </div>
      <div className="toolbar">
        <div className="seg seg-inline" role="group" aria-label="Show">
          <button aria-pressed={ui.mode === 'all'} onClick={() => patchUi({ mode: 'all' })}>Everyone</button>
          <button aria-pressed={ui.mode === 'off'} onClick={() => patchUi({ mode: 'off' })}>Off track only</button>
        </div>
        {/* On phones the sidebar is hidden, so search moves here. */}
        <label className="search phone-only">
          <IconSearch />
          <input type="search" placeholder="Find a person" autoComplete="off" aria-label="Find a person"
            value={ui.query} onChange={e => patchUi({ query: e.target.value })} />
        </label>
        <label className="selbtn">
          <IconFilter className="i lead" />
          <select aria-label="Department" value={ui.dept ?? ''} onChange={e => patchUi({ dept: e.target.value || null })}>
            <option value="">All departments</option>
            {departments(state).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <IconSort className="i trail-i" />
        </label>
      </div>
      {ui.mode === 'off' && (
        <p className="mode-note">
          {off
            ? `Showing the ${off} ${off === 1 ? 'person' : 'people'} off track. On the chart, the managers above them stay visible so you can see where the problem rolls up.`
            : 'Nobody is off track right now.'}
        </p>
      )}
    </>
  );
}
