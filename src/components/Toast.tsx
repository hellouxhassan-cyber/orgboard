import { useStore } from '../state/context';

export function Toast() {
  const { toast, actions, hasUndo } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.n}>
      <span>{toast.msg}</span>
      {toast.undo && hasUndo() && <button onClick={actions.undo}>Undo</button>}
    </div>
  );
}
