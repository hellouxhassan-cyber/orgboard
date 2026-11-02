import { useState } from 'react';
import { useStore } from '../state/context';

/** On phones the sidebar is hidden, so its reset action lives at the bottom of the page. */
export function PhoneFooter() {
  const { actions } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="phone-foot phone-only">
      {confirm ? (
        <>
          <span>Restore the sample company? Your changes will be replaced.</span>
          <span className="row-f">
            <button className="btn sm danger" onClick={() => { actions.reset(); setConfirm(false); }}>Restore</button>
            <button className="btn sm" onClick={() => setConfirm(false)}>Cancel</button>
          </span>
        </>
      ) : <button className="linkish" onClick={() => setConfirm(true)}>Reset sample data</button>}
    </div>
  );
}
