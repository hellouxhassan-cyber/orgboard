import { Component, type ReactNode } from 'react';
import { STORE_KEY } from '../state/store';

/** Last line of defence: if saved data ever breaks rendering, offer a way back instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  reset = () => {
    try { localStorage.removeItem(STORE_KEY); } catch { /* storage blocked */ }
    location.reload();
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="crash" role="alert">
        <h1>Something in your saved data could not be shown</h1>
        <p>Restoring the sample company will fix it. Your current changes in this browser will be replaced.</p>
        <button className="btn accent" onClick={this.reset}>Reset sample data</button>
      </div>
    );
  }
}
